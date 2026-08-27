import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";

const sections = [
  {
    heading: "1. Objet",
    paragraphs: [
      "Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'usage de la plateforme MyStreet, accessible via l'application mobile et le site mystreet.fr. La structure juridique d'exploitation sera renseignée aux mentions légales avant l'ouverture du service à Lille en septembre 2026.",
      "MyStreet est une marketplace de quartier permettant à des particuliers et professionnels d'acheter, vendre, louer et proposer des services entre voisins, dans une zone géographique délimitée.",
    ],
  },
  {
    heading: "2. Définitions",
    paragraphs: [
      "« Utilisateur » désigne toute personne physique ou morale inscrite sur la Plateforme.",
      "« Annonce » désigne une offre de vente, location ou service publiée par un Utilisateur.",
      "« Transaction » désigne tout échange validé entre deux Utilisateurs via le système de paiement protégé.",
    ],
  },
  {
    heading: "3. Inscription",
    paragraphs: [
      "L'inscription est gratuite, ouverte aux personnes majeures résidant en France métropolitaine, dans une zone couverte par MyStreet.",
      "L'Utilisateur garantit l'exactitude des informations fournies. Une vérification d'identité (KYC) peut être demandée à partir de la deuxième Transaction.",
    ],
  },
  {
    heading: "4. Annonces",
    paragraphs: [
      "L'Utilisateur est seul responsable du contenu, de la légalité et de la conformité des Annonces qu'il publie.",
      "Sont strictement interdits : contrefaçons, animaux, médicaments, armes, alcools sans licence, documents officiels, et plus largement tout bien dont la vente est restreinte par la loi française.",
      "MyStreet se réserve le droit de retirer toute Annonce non conforme, sans préavis.",
    ],
  },
  {
    heading: "5. Transactions",
    paragraphs: [
      "Les Transactions sont conclues directement entre Utilisateurs. MyStreet fournit le parcours de paiement sécurisé et de résolution des incidents décrit ci-dessous ; cette formulation ne constitue pas une qualification juridique de séquestre.",
      "Pour un achat par carte, le paiement est conservé en attente de la confirmation de réception par l'acheteur dans l'application. Après cette confirmation, la part du vendeur est disponible immédiatement pour un article de moins de 500 € et après environ 48 heures pour un article de 500 € ou plus. Un remboursement, un litige ou une annulation bloque ce versement.",
      "Sans confirmation de réception dans les sept jours calendaires, aucun versement ni remboursement n'est automatique : la Transaction est transmise à notre équipe pour examen. Les deux parties reçoivent des rappels et peuvent signaler un problème dans l'application.",
    ],
  },
  {
    heading: "6. Frais",
    paragraphs: [
      "L'usage de la Plateforme est gratuit en publication comme en achat. Une commission de 5 % est prélevée sur la part du vendeur lors d'une vente finalisée dans l'app. Les boosts à l'unité (de 0,99 € à 14,99 €) sont optionnels.",
      "Les tarifs en vigueur sont publiés sur mystreet.fr/pricing. Toute modification fait l'objet d'une notification trente jours avant entrée en vigueur.",
    ],
  },
  {
    heading: "7. Modération",
    paragraphs: [
      "MyStreet met en œuvre des moyens de modération automatisée et humaine pour garantir le respect de la Charte de la communauté.",
      "Tout manquement peut entraîner avertissement, suspension temporaire ou bannissement, selon la gravité, sur décision motivée et contestable.",
    ],
  },
  {
    heading: "8. Responsabilité",
    paragraphs: [
      "MyStreet n'est pas partie aux Transactions et ne saurait être tenue responsable de la qualité, conformité ou sécurité des biens et services échangés.",
      "MyStreet s'engage à mettre en œuvre les moyens raisonnables pour assurer la disponibilité de la Plateforme, sans garantie d'absence d'interruption.",
    ],
  },
  {
    heading: "9. Données personnelles",
    paragraphs: [
      "Le traitement des données personnelles est régi par la Politique de confidentialité, conforme au RGPD et à la loi Informatique et Libertés.",
      "L'Utilisateur dispose à tout moment des droits d'accès, rectification, opposition, effacement et portabilité, exerçables à dpo@mystreet.fr.",
    ],
  },
  {
    heading: "10. Litiges",
    paragraphs: [
      "Tout litige entre Utilisateurs peut être porté à l'attention de MyStreet via l'outil de signalement intégré. Une médiation gratuite est proposée sous 48 h ouvrées.",
      "Conformément à l'article L612-1 du Code de la consommation, l'Utilisateur consommateur peut recourir gratuitement au médiateur de la consommation référencé sur mystreet.fr.",
    ],
  },
  {
    heading: "11. Modifications",
    paragraphs: [
      "MyStreet peut modifier les CGU à tout moment. Les Utilisateurs sont notifiés par e-mail et dans l'app au moins trente jours avant l'entrée en vigueur des modifications.",
      "L'usage continu de la Plateforme après cette date vaut acceptation des nouvelles CGU.",
    ],
  },
  {
    heading: "12. Loi applicable",
    paragraphs: [
      "Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou exécution relève de la compétence des tribunaux de Lille, sous réserve des règles d'ordre public.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow">
          <Eyebrow>Légal</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Conditions générales{" "}
            <span className="font-serif italic text-primary">d'utilisation.</span>
          </h1>
          <p className="mt-4 text-caption text-n-500">
            Dernière mise à jour : 23 août 2026
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container width="narrow">
          <div className="prose prose-lg max-w-none text-n-700 prose-headings:text-ink prose-headings:font-medium prose-strong:text-ink">
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
