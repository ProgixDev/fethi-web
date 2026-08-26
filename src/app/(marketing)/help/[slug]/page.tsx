import Link from "next/link";
import { ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { Container, Section } from "@/components/marketing/shell/Container";

type Article = {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  updatedAt: string;
  body: { lead: string; sections: { heading: string; paragraphs: string[] }[] };
};

const articles: Record<string, Article> = {
  "comment-publier-une-annonce": {
    slug: "comment-publier-une-annonce",
    title: "Comment publier une annonce en 20 secondes",
    category: "Vendre",
    categorySlug: "vendre",
    updatedAt: "2 mai 2026",
    body: {
      lead: "Publier sur MyStreet a été conçu pour tenir le temps d'un café : trois photos, un titre, un prix. Voici la marche à suivre.",
      sections: [
        {
          heading: "Avant de commencer",
          paragraphs: [
            "Posez votre objet dans une lumière naturelle, contre un fond sobre — un mur, une table en bois, un drap. Pas besoin de studio.",
            "Vérifiez qu'il est en état de partir : nettoyé, complet, avec ses accessoires si possible. C'est ce qui fera qu'il se vendra en deux jours plutôt qu'en deux semaines.",
          ],
        },
        {
          heading: "Les trois étapes",
          paragraphs: [
            "Ouvrez l'app, appuyez sur le bouton Publier en bas à droite. Prenez trois photos directement dans l'app — la catégorie est détectée automatiquement.",
            "Tapez un titre court. La suggestion de prix s'affiche en dessous, basée sur les ventes récentes du quartier. Vous pouvez l'accepter ou l'ajuster.",
            "Confirmez. L'annonce est en ligne, visible immédiatement par les voisins de votre périmètre. Les premières vues arrivent en moins d'une heure.",
          ],
        },
      ],
    },
  },
  "comment-payer-en-ligne": {
    slug: "comment-payer-en-ligne",
    title: "Moyens de paiement acceptés",
    category: "Paiement",
    categorySlug: "paiement",
    updatedAt: "28 avril 2026",
    body: {
      lead: "Le paiement sur MyStreet est protégé : il est bloqué jusqu'à la rencontre, puis libéré au vendeur quand vous validez la réception.",
      sections: [
        {
          heading: "Cartes et wallets",
          paragraphs: [
            "Nous acceptons Visa, Mastercard, American Express, Apple Pay et Google Pay. Le paiement est traité par Stripe, certifié PCI-DSS niveau 1.",
            "Les cartes prépayées et les comptes Revolut Junior ne sont pas acceptés au-delà de 100 €.",
          ],
        },
      ],
    },
  },
  "paiement-protege": {
    slug: "paiement-protege",
    title: "Comment fonctionne le paiement sécurisé",
    category: "Paiement",
    categorySlug: "paiement",
    updatedAt: "23 août 2026",
    body: {
      lead: "Votre carte est débitée par MyStreet, mais la part du vendeur reste en attente jusqu'à votre confirmation de réception dans l'application. Ce n'est pas un service juridique de séquestre.",
      sections: [
        {
          heading: "Après la rencontre",
          paragraphs: [
            "Vérifiez l'objet avant de confirmer. Une fois la réception confirmée, le vendeur reçoit sa part immédiatement pour un article de moins de 500 € et après environ 48 h pour un article de 500 € ou plus.",
            "Le vendeur doit avoir une identité vérifiée et un compte de versement activé. Cette vérification ne change jamais votre droit de signaler un problème.",
          ],
        },
        {
          heading: "En cas de problème ou d'absence de confirmation",
          paragraphs: [
            "N'appuyez pas sur confirmer et ouvrez un litige depuis votre commande. Un remboursement, une annulation ou une contestation bancaire bloque le versement au vendeur.",
            "Sans confirmation dans les sept jours calendaires, aucun argent n'est libéré ni remboursé automatiquement : notre équipe examine la Transaction. Nous vous envoyons des rappels avant cette étape.",
          ],
        },
      ],
    },
  },
  "supprimer-mon-compte": {
    slug: "supprimer-mon-compte",
    title: "Supprimer mon compte",
    category: "Compte",
    categorySlug: "compte",
    updatedAt: "20 août 2026",
    body: {
      lead: "La suppression se fait directement dans l'application, en quelques étapes. Elle est définitive : une fois confirmée, il n'y a pas de retour en arrière.",
      sections: [
        {
          heading: "Où trouver l'option",
          paragraphs: [
            "Dans l'app mobile : Paramètres → Mon compte → Supprimer le compte, tout en bas de l'écran.",
            "Une confirmation vous rappelle ce qui va être effacé avant de continuer, puis un dernier écran vous demande de cocher trois cases (effacement, caractère définitif, sort des annonces en cours) pour activer le bouton de suppression.",
          ],
        },
        {
          heading: "Ce qui se passe concrètement",
          paragraphs: [
            "Votre profil est anonymisé (nom, photo, bio, âge, profession, adresse) et votre compte est fermé — vous ne pouvez plus vous reconnecter.",
            "Vos annonces actives ou en pause sont retirées de la vente.",
            "La suppression est bloquée si vous avez une commande en cours (en attente de remise en main propre) ou un litige ouvert, côté acheteur comme vendeur — réglez-le d'abord, puis réessayez.",
            "Vos anciennes commandes ne sont pas effacées : la loi nous oblige à conserver les données de transaction (comptabilité, lutte anti-blanchiment) — voir la Politique de confidentialité, section « Durée de conservation ».",
          ],
        },
        {
          heading: "Récupérer vos données avant de partir",
          paragraphs: [
            "Le même écran propose d'abord de vous envoyer une copie de vos données par e-mail (droit à la portabilité, RGPD) — utile si vous voulez garder une trace avant de supprimer votre compte.",
          ],
        },
        {
          heading: "Vous n'avez pas l'app sous la main",
          paragraphs: [
            "Écrivez à support@mystreet.fr depuis l'adresse e-mail associée à votre compte ; nous traitons les demandes de suppression manuelles sous 30 jours conformément au RGPD.",
          ],
        },
      ],
    },
  },
};

const fallback = (slug: string): Article => ({
  slug,
  title: "Article d'aide",
  category: "Aide",
  categorySlug: "aide",
  updatedAt: "1 mai 2026",
  body: {
    lead: "Cet article est en cours de rédaction. Voici en attendant un aperçu de la marche à suivre.",
    sections: [
      {
        heading: "Ce qu'il faut savoir",
        paragraphs: [
          "MyStreet est conçue pour rendre les transactions simples entre voisins. Si vous avez une question précise, le support répond sous 24 h.",
          "En attendant que cet article soit publié, vous pouvez consulter notre charte ou écrire directement à support@mystreet.fr.",
        ],
      },
      {
        heading: "Aller plus loin",
        paragraphs: [
          "Les articles populaires couvrent la majorité des questions des nouveaux utilisateurs. Sinon, n'hésitez pas à signaler ce sujet — on rédige les articles dans l'ordre des demandes.",
        ],
      },
    ],
  },
});

const related = [
  { slug: "fixer-un-rendez-vous", title: "Fixer un rendez-vous avec un voisin" },
  { slug: "paiement-protege", title: "Comment fonctionne le paiement protégé" },
  { slug: "ouvrir-un-litige", title: "Ouvrir un litige" },
];

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles[slug] ?? fallback(slug);

  return (
    <Section className="bg-paper">
      <Container>
        <nav className="flex items-center gap-1.5 text-caption text-n-500">
          <Link href="/help" className="hover:text-primary">Aide</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{article.category}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-n-700">{article.title}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <article className="lg:col-span-8">
            <h1 className="text-display tracking-tight text-ink">{article.title}</h1>
            <p className="mt-3 text-caption text-n-500">
              Mis à jour le {article.updatedAt}
            </p>
            <div className="prose prose-lg mt-8 max-w-none text-n-700 prose-headings:text-ink prose-headings:font-medium prose-strong:text-ink">
              <p className="lead">{article.body.lead}</p>
              {article.body.sections.map((s) => (
                <div key={s.heading}>
                  <h2>{s.heading}</h2>
                  {s.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-xl border border-n-100 bg-surface p-6">
              <p className="text-body font-medium text-ink">
                Cet article a-t-il été utile ?
              </p>
              <div className="mt-4 flex gap-3">
                <button className="inline-flex h-10 items-center gap-2 rounded-md border border-n-200 bg-paper px-4 text-body-sm text-n-700 hover:border-accent hover:text-accent">
                  <ThumbsUp className="h-4 w-4" /> Oui
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-md border border-n-200 bg-paper px-4 text-body-sm text-n-700 hover:border-primary hover:text-primary">
                  <ThumbsDown className="h-4 w-4" /> Non
                </button>
              </div>
            </div>
          </article>

          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-n-100 bg-surface p-6">
              <p className="text-label uppercase tracking-[0.14em] text-n-500">Articles similaires</p>
              <ul className="mt-4 space-y-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/help/${r.slug}`}
                      className="text-body text-n-700 hover:text-primary"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
