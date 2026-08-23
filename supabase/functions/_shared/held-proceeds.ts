import Stripe from "npm:stripe@^22.3.0";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const IMMEDIATE_RELEASE_CENTS = 50_000;

type Hold = {
  id: string;
  order_id: string;
  seller_id: string;
  stripe_charge_id: string;
  seller_net_cents: number;
  status: string;
  release_after: string | null;
};

/** Schedule buyer-authorised release; this never accepts an amount from mobile. */
export async function scheduleBuyerRelease(
  svc: SupabaseClient,
  orderId: string,
): Promise<void> {
  const { data: hold, error } = await svc
    .from("held_seller_proceeds")
    .select("id, gross_cents, status")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw new Error(`hold_lookup_failed:${error.message}`);
  if (!hold || hold.status !== "HELD") return;

  const delayMs = hold.gross_cents >= IMMEDIATE_RELEASE_CENTS
    ? 48 * 60 * 60 * 1000
    : 0;
  const releaseAfter = new Date(Date.now() + delayMs).toISOString();
  const { error: updateError } = await svc
    .from("held_seller_proceeds")
    .update({
      status: "RELEASE_PENDING",
      buyer_confirmed_at: new Date().toISOString(),
      release_after: releaseAfter,
    })
    .eq("id", hold.id)
    .eq("status", "HELD");
  if (updateError) throw new Error(`hold_schedule_failed:${updateError.message}`);
}

/** Moves a due, buyer-authorised hold to the verified seller exactly once. */
export async function releaseDueHold(
  svc: SupabaseClient,
  stripe: Stripe,
  hold: Hold,
): Promise<"released" | "not_due" | "busy" | "not_eligible"> {
  if (hold.status !== "RELEASE_PENDING" || !hold.release_after ||
    new Date(hold.release_after).getTime() > Date.now()) return "not_due";

  const { data: claimed, error: claimError } = await svc
    .from("held_seller_proceeds")
    .update({ status: "RELEASING" })
    .eq("id", hold.id)
    .eq("status", "RELEASE_PENDING")
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error(`hold_claim_failed:${claimError.message}`);
  if (!claimed) return "busy";

  try {
    // A terminal Stripe webhook can win the race after this worker claims a
    // hold. Check the server-owned Order immediately before asking Stripe to
    // move money; a later winning webhook is compensated below.
    const { data: order, error: orderError } = await svc
      .from("orders")
      .select("payment_status")
      .eq("id", hold.order_id)
      .maybeSingle();
    if (orderError) throw new Error(`release_order_lookup_failed:${orderError.message}`);
    if (order?.payment_status !== "SUCCEEDED") {
      await svc.from("held_seller_proceeds").update({ status: "REVIEW_REQUIRED", terminal_reason: "payment_not_releasable" }).eq("id", hold.id).eq("status", "RELEASING");
      return "not_eligible";
    }
    const [{ data: profile, error: profileError }, { data: payout, error: payoutError }] = await Promise.all([
      svc.from("profiles").select("kyc_status").eq("id", hold.seller_id).maybeSingle(),
      svc.from("payout_accounts").select("stripe_account_id, onboarding_status, payouts_enabled").eq("user_id", hold.seller_id).maybeSingle(),
    ]);
    if (profileError || payoutError) throw new Error(`seller_lookup_failed:${profileError?.message ?? payoutError?.message}`);
    if (profile?.kyc_status !== "VERIFIED" || !payout || payout.onboarding_status !== "ENABLED" || !payout.payouts_enabled) {
      await svc.from("held_seller_proceeds").update({ status: "RELEASE_PENDING" }).eq("id", hold.id);
      return "not_eligible";
    }

    const { data: receivables, error: receivableError } = await svc
      .from("seller_fee_receivables")
      .select("id, amount_cents")
      .eq("seller_id", hold.seller_id)
      .eq("status", "OUTSTANDING")
      .order("created_at", { ascending: true });
    if (receivableError) throw new Error(`receivable_lookup_failed:${receivableError.message}`);

    let remaining = hold.seller_net_cents;
    const settled = (receivables ?? []).filter((row) => {
      if (row.amount_cents > remaining) return false;
      remaining -= row.amount_cents;
      return true;
    });
    if (remaining <= 0) throw new Error("seller_transfer_amount_invalid");

    const transfer = await stripe.transfers.create({
      amount: remaining,
      currency: "eur",
      destination: payout.stripe_account_id,
      source_transaction: hold.stripe_charge_id,
      transfer_group: hold.order_id,
      metadata: { orderId: hold.order_id, heldProceedsId: hold.id },
    }, { idempotencyKey: `held_proceeds_release:${hold.order_id}` });

    const { data: released, error: releasedError } = await svc
      .from("held_seller_proceeds")
      .update({
        status: "RELEASED",
        stripe_transfer_id: transfer.id,
        settled_receivable_cents: hold.seller_net_cents - remaining,
        released_at: new Date().toISOString(),
      })
      .eq("id", hold.id)
      .eq("status", "RELEASING")
      .select("id")
      .maybeSingle();
    if (releasedError) throw new Error(`hold_release_persist_failed:${releasedError.message}`);
    if (!released) {
      // A refund/dispute webhook won after Stripe accepted the transfer. Undo
      // the movement before returning. Persist the transfer first: a failed
      // compensation is durable and picked up by the reconciler.
      await svc.from("held_seller_proceeds")
        .update({ stripe_transfer_id: transfer.id, terminal_reason: "terminal_race_transfer_reversal_pending" })
        .eq("id", hold.id)
        .in("status", ["REFUNDED", "DISPUTED", "REVIEW_REQUIRED"]);
      await reverseTerminalTransfer(svc, stripe, hold.order_id, "terminal_race");
      return "not_eligible";
    }

    for (const receivable of settled) {
      const { error: settleError } = await svc
        .from("seller_fee_receivables")
        .update({ status: "SETTLED", settled_at: new Date().toISOString(), settled_via: transfer.id })
        .eq("id", receivable.id)
        .eq("status", "OUTSTANDING");
      if (settleError) throw new Error(`receivable_settle_failed:${settleError.message}`);
    }
    return "released";
  } catch (error) {
    await svc.from("held_seller_proceeds").update({ status: "RELEASE_PENDING" }).eq("id", hold.id).eq("status", "RELEASING");
    throw error;
  }
}

/** Reverse a released/late-race transfer; failures remain durable for retry. */
export async function reverseTerminalTransfer(
  svc: SupabaseClient,
  stripe: Stripe,
  orderId: string,
  reason: "refund" | "dispute" | "terminal_race",
): Promise<"not_transferred" | "reversed" | "pending"> {
  const { data: hold, error } = await svc.from("held_seller_proceeds")
    .select("id, stripe_transfer_id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw new Error(`terminal_transfer_lookup_failed:${error.message}`);
  if (!hold?.stripe_transfer_id) return "not_transferred";
  try {
    await stripe.transfers.createReversal(hold.stripe_transfer_id, {}, {
      idempotencyKey: `held_proceeds_${reason}_reversal:${orderId}`,
    });
    await svc.from("held_seller_proceeds")
      .update({ terminal_reason: `${reason}_transfer_reversed` })
      .eq("id", hold.id);
    return "reversed";
  } catch (error) {
    console.error(`transfer reversal pending for ${orderId}`, error);
    await svc.from("held_seller_proceeds")
      .update({ terminal_reason: `${reason}_transfer_reversal_pending` })
      .eq("id", hold.id);
    return "pending";
  }
}

/** Seven days without buyer confirmation is a staff-review case, never an auto-payout/refund. */
export async function markExpiredUnconfirmedHolds(svc: SupabaseClient): Promise<number> {
  const { data, error } = await svc
    .from("held_seller_proceeds")
    .update({ status: "REVIEW_REQUIRED", terminal_reason: "buyer_confirmation_timeout" })
    .eq("status", "HELD")
    .lt("review_after", new Date().toISOString())
    .select("id");
  if (error) throw new Error(`hold_timeout_failed:${error.message}`);
  return data?.length ?? 0;
}
