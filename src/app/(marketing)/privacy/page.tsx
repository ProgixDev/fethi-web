import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";

const sections = [
  {
    heading: "Données collectées",
    paragraphs: [
      "Identité : nom, prénom, date de naissance, adresse, e-mail, téléphone, pièce d'identité (KYC).",
      "Localisation : adresse de résidence, géolocalisation approximative (rayon 200 m) pour le matching d'annonces.",
      "Activité : annonces publiées, transactions, messages, signalements, notations.",
      "Technique : adresse IP, type d'appareil, journaux de connexion, données de paiement (tokenisées via Stripe).",
    ],
  },
  {
    heading: "Finalités",
    paragraphs: [
      "Permettre l'usage de la Plateforme : matching géographique, messagerie, paiement protégé.",
      "Vérifier l'identité des Utilisateurs (KYC) et lutter contre la fraude.",
      "Améliorer le produit, sur la base de statistiques anonymisées.",
      "Vous informer des nouveautés et opérations de service (vous pouvez vous désinscrire à tout moment).",
    ],
  },
  {
    heading: "Bases légales",
    paragraphs: [
      "Exécution du contrat (CGU) pour les fonctionnalités essentielles.",
      "Obligation légale pour le KYC et la conservation des données de transaction.",
      "Intérêt légitime pour la prévention de la fraude et l'amélioration du produit.",
      "Consentement pour les communications marketing et les cookies non strictement nécessaires.",
    ],
  },
  {
    heading: "Durée de conservation",
    paragraphs: [
      "Données de compte : pendant la durée d'inscription, puis trois ans en archive en cas de réactivation.",
      "Données de transaction : dix ans (obligation comptable et anti-blanchiment).",
      "Données de connexion : un an (LCEN).",
      "Cookies : treize mois maximum.",
    ],
  },
  {
    heading: "Partage de données",
    paragraphs: [
      "Aucune revente, jamais. Pas de pub ciblée, pas de cession à des courtiers de données.",
      "Sous-traitants strictement nécessaires : Stripe (paiement et vérification d'identité KYC via Stripe Connect), Supabase (hébergement de la base de données, authentification et stockage des fichiers, dans l'Union européenne), Vercel (hébergement du site web), Expo (notifications push sur l'application mobile). Tous sont liés par des accords de sous-traitance conformes au RGPD.",
    ],
  },
  {
    heading: "Vos droits (RGPD)",
    paragraphs: [
      "Accès, rectification, effacement, opposition, limitation, portabilité.",
      "Vous pouvez exercer ces droits à tout moment depuis votre compte ou par e-mail à dpo@mystreet.fr.",
      "Vous disposez du droit d'introduire une réclamation auprès de la CNIL (cnil.fr).",
    ],
  },
  {
    heading: "Contact DPO",
    paragraphs: [
      "Notre Délégué à la Protection des Données est joignable à dpo@mystreet.fr. La structure juridique d'exploitation et son siège seront publiés dans les mentions légales avant l'ouverture du service en septembre 2026.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow">
          <Eyebrow>Légal</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Politique de{" "}
            <span className="font-serif italic text-primary">confidentialité.</span>
          </h1>
          <p className="mt-4 text-caption text-n-500">
            Dernière mise à jour : 15 mars 2026
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container width="narrow">
          <div className="prose prose-lg max-w-none text-n-700 prose-headings:text-ink prose-headings:font-medium prose-strong:text-ink">
            <p>
              MyStreet est conçue avec le respect de votre vie privée comme
              principe directeur. Nous collectons le minimum, nous ne
              revendons rien, et nous chiffrons tout ce qui peut l'être.
            </p>
            {sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
