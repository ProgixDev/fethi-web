# DRAFT — Didit KYC copy (privacy policy + in-app consent)

**Status: DRAFT. Not legally reviewed. Not live anywhere.** Written to give
issue #28 a concrete starting point, not a final text. Two things must
happen before any of this ships:

1. **You get Didit's DPA and their data-retention policy** (`hello@didit.me`
   — not published in their docs, per earlier research). The retention line
   below is a placeholder until then.
2. **A human (ideally counsel) reviews this** before it's pasted into the
   live privacy policy or the app. This covers biometric + government-ID
   data — GDPR "special category" data (Article 9) — genuinely not
   something to ship on AI-drafted text alone.

Nothing here is wired into any live file yet, deliberately — see
`docs/WEB-BACKEND-SYNC.md` (mobile repo) for why the mobile screens still
show the old Stripe copy.

---

## 1. Privacy policy edit (`src/app/(marketing)/privacy/page.tsx`)

### "Données collectées" — current

> Identité : nom, prénom, date de naissance, adresse, e-mail, téléphone, pièce d'identité (KYC).

### Proposed

> Identité : nom, prénom, date de naissance, adresse, e-mail, téléphone, pièce d'identité et photo de vérification faciale (KYC, via Didit).

*(Adds "photo de vérification faciale" — the current line doesn't
distinguish that Didit's flow includes a selfie/liveness capture, which
Stripe Connect's bundled flow may not have made as explicit. Confirm this
matches what "Free KYC" actually captures before shipping.)*

### "Finalités" — current

> Vérifier l'identité des Utilisateurs (KYC) et lutter contre la fraude.

### Proposed

> Vérifier l'identité des Utilisateurs (KYC, via notre partenaire Didit) et lutter contre la fraude.

### "Durée de conservation" — current

No line exists for KYC/identity data specifically — only "Données de
compte", "Données de transaction", "Données de connexion", "Cookies".

### Proposed (new line — **placeholder value, do not ship as-is**)

> Données de vérification d'identité (KYC) : **[À COMPLÉTER — durée de conservation à confirmer avec Didit et à valider en interne avant mise en ligne]**.

*(This is the one line I can't draft for real — it depends on Didit's own
retention policy AND your own decision for how long `profiles.kyc_decision`
stays in our database. Both open per the previous message.)*

### "Partage de données" — current

> Sous-traitants strictement nécessaires : Stripe (paiement et vérification d'identité KYC via Stripe Connect), Supabase (hébergement de la base de données, authentification et stockage des fichiers, dans l'Union européenne), Vercel (hébergement du site web), Expo (notifications push sur l'application mobile). Tous sont liés par des accords de sous-traitance conformes au RGPD.

### Proposed

> Sous-traitants strictement nécessaires : Stripe (paiement et versements via Stripe Connect), Didit (vérification d'identité KYC — pièce d'identité et reconnaissance faciale), Supabase (hébergement de la base de données, authentification et stockage des fichiers, dans l'Union européenne), Vercel (hébergement du site web), Expo (notifications push sur l'application mobile). Tous sont liés par des accords de sous-traitance conformes au RGPD **[Didit : accord de sous-traitance à finaliser avant mise en ligne]**.

*(Splits Stripe's role — paiement/versements only, not identity, once
Didit takes over that piece — and adds Didit as a new sub-processor.)*

---

## 2. In-app consent copy (mobile — `src/app/kyc/intro.tsx` / `kyc/index.tsx`)

Not edited in the mobile repo yet — copy only, for whoever wires the actual
screen swap. Mirrors the existing screens' tone/structure exactly, only the
partner-specific claims change.

### `kyc/intro.tsx` — current

- Title: *"La confiance se gagne dans les deux sens."* — **keep as-is**, not partner-specific.
- Body: *"Nous vérifions tout le monde avant le premier versement — via Stripe, notre partenaire de paiement."*
- Points:
  1. **Vérification sécurisée par Stripe** — Notre partenaire de paiement vérifie ton identité et ton IBAN.
  2. **Tes données vont directement à Stripe** — MyStreet ne stocke aucune pièce d'identité ni coordonnée bancaire.
  3. **Prend 2 à 3 minutes** — Munis-toi d'une pièce d'identité et de ton IBAN.

### `kyc/intro.tsx` — proposed

- Title: unchanged.
- Body: *"Nous vérifions l'identité de chaque membre — via Didit, notre partenaire de vérification d'identité."*
- Points:
  1. **Vérification sécurisée par Didit** — Didit vérifie ta pièce d'identité et ton visage, pour confirmer que tu es bien toi.
  2. **Ta pièce d'identité reste chez Didit** — MyStreet ne stocke pas ta pièce d'identité ; seul le résultat de la vérification (validée / refusée) nous est transmis. *(Careful: we DO store the decision breakdown in `profiles.kyc_decision` per SCR-020 — this line must stay accurate to that, not claim we store literally nothing.)*
  3. **Prend 2 à 3 minutes** — Munis-toi d'une pièce d'identité (carte nationale, passeport) et de bonnes conditions de lumière.

**IBAN removed** from this screen's copy entirely — once Stripe Connect
banking is a separate step (`payouts/connect.tsx`, untouched), this screen
should stop mentioning IBAN. See open design question below.

### `kyc/index.tsx` — current

- Body: *"La vérification est gérée par notre partenaire de paiement, Stripe. Tes informations lui sont transmises directement — MyStreet ne stocke aucune pièce d'identité ni coordonnée bancaire."*
- "Identité vérifiée" success card: *"Tu peux recevoir des versements. Stripe verse selon ta fréquence."*

### `kyc/index.tsx` — proposed

- Body: *"La vérification d'identité est gérée par notre partenaire, Didit. Ta pièce d'identité lui est transmise directement — MyStreet ne la stocke pas ; seul le résultat de la vérification nous est transmis."*
- "Identité vérifiée" success card: **needs a product decision, not just copy** — see below.

---

## Open design question (not copy — flagging, not deciding)

Today, one Stripe Connect flow does identity + banking together, so
"Identité vérifiée" ⇒ "tu peux recevoir des versements" is true in one step.
Once split (Didit = identity, Stripe Connect = banking, per #28/#35), being
`kyc_status: VERIFIED` no longer implies payouts are enabled — the user
would *also* need to separately complete `payouts/connect.tsx`. The
"Identité vérifiée" success card's copy and its CTA (currently routes to
`/payouts`) need to reflect that as two steps, not one. Not resolved here —
this is UX/flow work for whoever builds the actual screen swap, not
something a copy draft should paper over.
