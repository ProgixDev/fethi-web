// Canonical marketplace pricing contract (issue #30 / SCR-024).
//
// Product rules approved in the original #30 decision:
// - the buyer pays exactly the advertised/agreed item price;
// - MyStreet deducts a 5% commission from seller proceeds;
// - no VAT or other tax is added to the buyer total;
// - percentage amounts use standard nearest-cent rounding;
// - a pre-validation full refund unwinds both seller transfer and commission.

export const PRICING_VERSION = "seller-commission-v1";
export const CURRENCY = "eur" as const;
export const SELLER_FEE_BASIS_POINTS = 500;

export type ListingPricing = {
  listing_type: string;
  price_cents: number | null;
  price_per_day_cents: number | null;
  deposit_cents: number | null;
  hourly_rate_cents: number | null;
  flat_rate_cents: number | null;
};

export type PricingOptions = {
  paymentMethod: "card" | "handoff";
  rentalStart: string | null;
  rentalEnd: string | null;
  serviceHours: number | null;
  agreedItemCents?: number | null;
};

export type PricingBreakdown = {
  pricingVersion: typeof PRICING_VERSION;
  currency: typeof CURRENCY;
  itemCents: number;
  buyerFeeCents: 0;
  taxCents: 0;
  buyerTotalCents: number;
  sellerFeeCents: number;
  sellerNetCents: number;
  persistedOrderFeeCents: number;
  depositCents: number;
  rentalStart: string | null;
  rentalEnd: string | null;
};

export class PricingError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export function calculateSellerFee(itemCents: number): number {
  return Math.round((itemCents * SELLER_FEE_BASIS_POINTS) / 10_000);
}

function rentalDays(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T00:00:00.000Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    throw new PricingError("rental_dates_invalid");
  }
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

export function calculatePricing(
  listing: ListingPricing,
  options: PricingOptions,
): PricingBreakdown {
  let itemCents: number;
  let depositCents = 0;
  let rentalStart: string | null = null;
  let rentalEnd: string | null = null;

  if (options.agreedItemCents != null) {
    itemCents = options.agreedItemCents;
  } else if (listing.listing_type === "LOCATION") {
    if (!options.rentalStart || !options.rentalEnd) {
      throw new PricingError("rental_dates_required");
    }
    itemCents =
      rentalDays(options.rentalStart, options.rentalEnd) *
      (listing.price_per_day_cents ?? 0);
    depositCents = listing.deposit_cents ?? 0;
    rentalStart = options.rentalStart;
    rentalEnd = options.rentalEnd;
  } else if (listing.listing_type === "SERVICE") {
    const hours =
      options.serviceHours && options.serviceHours > 0
        ? options.serviceHours
        : 1;
    itemCents = listing.flat_rate_cents
      ? listing.flat_rate_cents
      : (listing.hourly_rate_cents ?? 0) * hours;
  } else {
    itemCents = listing.price_cents ?? 0;
  }

  if (!Number.isSafeInteger(itemCents) || itemCents <= 0) {
    throw new PricingError("listing_not_purchasable");
  }

  const sellerFeeCents = calculateSellerFee(itemCents);
  return {
    pricingVersion: PRICING_VERSION,
    currency: CURRENCY,
    itemCents,
    buyerFeeCents: 0,
    taxCents: 0,
    buyerTotalCents: itemCents,
    sellerFeeCents,
    sellerNetCents: itemCents - sellerFeeCents,
    // Handoff moves no money through Stripe. Its identical seller commission
    // is recorded in seller_fee_receivables instead of orders.fee_cents.
    persistedOrderFeeCents:
      options.paymentMethod === "card" ? sellerFeeCents : 0,
    depositCents,
    rentalStart,
    rentalEnd,
  };
}
