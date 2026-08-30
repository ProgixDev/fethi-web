import type { Metadata } from "next";

// Stripe Account Links requires real https return_url/refresh_url values —
// it rejects custom app URI schemes (mystreet://...) outright with
// url_invalid. This page exists purely as that https destination for the
// mobile Connect onboarding flow (opened in an in-app browser via
// openBrowserAsync): the seller taps Stripe's "Return to MyStreet" link,
// lands here, and manually switches back to the app. `payout_accounts` is
// already kept in sync by the Stripe webhook, so nothing needs to happen on
// this page beyond telling the seller they're done.

export const metadata: Metadata = {
  title: "Retour à MyStreet",
  robots: { index: false, follow: false },
};

export default function StripeReturnPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 24px",
        gap: 12,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>C&apos;est fait !</h1>
      <p style={{ fontSize: 15, color: "#666", maxWidth: 360, lineHeight: 1.5 }}>
        Vous pouvez fermer cette fenêtre et retourner dans l&apos;application
        MyStreet.
      </p>
    </main>
  );
}
