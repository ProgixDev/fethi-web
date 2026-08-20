import Image from "next/image";
import Link from "next/link";
import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";

type Post = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  cover: string;
};

const featured: Post = {
  slug: "pourquoi-marcher-pour-acheter",
  category: "Manifeste",
  title: "Pourquoi marcher pour acheter, en 2026",
  excerpt:
    "Quinze minutes à pied valent mieux que trois jours d'expédition. Ce que la livraison gratuite a fait disparaître, et ce qu'on essaie de retrouver, rue par rue.",
  date: "2 mai 2026",
  readTime: "7 min",
  cover: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1600&q=80",
};

const posts: Post[] = [
  {
    slug: "vieux-lille-marche-noel",
    category: "Quartier",
    title: "Vieux-Lille, premier quartier à ouvrir",
    excerpt:
      "Pourquoi on commence par le Vieux-Lille en septembre 2026 — densité, commerces de proximité déjà là, et un vrai centre pour se rencontrer.",
    date: "24 avril 2026",
    readTime: "4 min",
    cover: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80",
  },
  {
    slug: "louer-plutot-qu-acheter",
    category: "Sobriété",
    title: "Louer plutôt qu'acheter : cinq objets que personne ne devrait posséder",
    excerpt:
      "Une perceuse, une raclette, une tente, un karcher, une yaourtière. Le chiffre commun ? Trois utilisations par an, en moyenne.",
    date: "17 avril 2026",
    readTime: "5 min",
    cover: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80",
  },
  {
    slug: "wazemmes-portrait-vendeur",
    category: "Quartier",
    title: "Wazemmes, deuxième quartier à ouvrir",
    excerpt:
      "Marché, brocantes, une tradition d'échange déjà bien ancrée — pourquoi Wazemmes suit le Vieux-Lille dès le lancement.",
    date: "10 avril 2026",
    readTime: "6 min",
    cover: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1200&q=80",
  },
  {
    slug: "anti-livraison-15-minutes",
    category: "Manifeste",
    title: "L'anti-livraison-en-15-minutes",
    excerpt:
      "Pourquoi notre rayon de recherche est volontairement limité. La distance n'est pas un bug à corriger — c'est ce qui fait sens.",
    date: "3 avril 2026",
    readTime: "8 min",
    cover: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80",
  },
  {
    slug: "comment-bien-photographier",
    category: "Conseils",
    title: "Comment bien photographier un objet pour le vendre vite",
    excerpt:
      "Une fenêtre, un drap, dix secondes. Les trois principes que toute personne qui vend en moins d'une journée applique sans le savoir.",
    date: "27 mars 2026",
    readTime: "3 min",
    cover: "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=1200&q=80",
  },
  {
    slug: "kyc-pourquoi-on-le-fait",
    category: "Confiance",
    title: "KYC : pourquoi on contrôle, et où on s'arrête",
    excerpt:
      "Vérifier les identités sans transformer l'app en banque. Notre approche, et nos limites.",
    date: "20 mars 2026",
    readTime: "5 min",
    cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",
  },
];

function PostCard({ p, large }: { p: Post; large?: boolean }) {
  return (
    <Link
      href={`/blog/${p.slug}`}
      className="group block overflow-hidden rounded-xl border border-n-100 bg-surface transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className={`relative w-full overflow-hidden bg-n-100 ${large ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
        <Image
          src={p.cover}
          alt={p.title}
          fill
          sizes={large ? "(min-width: 1024px) 1100px, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="space-y-3 p-6">
        <p className="text-label uppercase tracking-[0.14em] text-primary-ink">{p.category}</p>
        <h3 className={`font-medium text-ink group-hover:text-primary ${large ? "text-display" : "text-h2"}`}>
          {p.title}
        </h3>
        <p className="text-body-sm text-n-600">{p.excerpt}</p>
        <p className="text-caption text-n-500">
          {p.date} · {p.readTime} de lecture
        </p>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Le journal de la rue</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Le{" "}
            <span className="font-serif italic text-primary">journal</span> de MyStreet.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            Manifeste, portraits, conseils. Ce qu'on observe, ce qu'on
            apprend, et parfois, ce qu'on aimerait changer.
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <PostCard p={featured} large />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} p={p} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
