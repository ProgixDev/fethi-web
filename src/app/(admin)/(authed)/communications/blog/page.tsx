import Image from "next/image";
import Link from "next/link";
import { Eye, PencilLine, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Blog" };

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  status: "draft" | "scheduled" | "published";
  cover: string;
  author: string;
  publishedAt?: string;
  scheduledFor?: string;
  readMin: number;
};

// Aucune table CMS blog cote backend (pas de `posts`/`articles` dans le
// schema) — exemples illustratifs uniquement, cf. NotConnectedNotice.
const examplePosts: Post[] = [
  {
    id: "p1",
    title: "Pourquoi MyStreet n'aura jamais de livraison",
    slug: "pas-de-livraison",
    excerpt: "Notre choix de fond, expliqué.",
    category: "Manifeste",
    status: "published",
    cover: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1200&q=80",
    author: "Fethi",
    publishedAt: "2026-04-12T08:00:00Z",
    readMin: 6,
  },
  {
    id: "p2",
    title: "Vieux-Lille en quinze annonces",
    slug: "vieux-lille-quinze-annonces",
    excerpt: "Tour d'horizon des trouvailles les plus marquantes du Vieux-Lille.",
    category: "Quartier",
    status: "scheduled",
    cover: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80",
    author: "Marie L.",
    scheduledFor: "2026-05-12T07:00:00Z",
    readMin: 4,
  },
];

const statusTone: Record<Post["status"], React.ComponentProps<typeof Pill>["tone"]> = {
  draft: "neutral",
  scheduled: "warning",
  published: "success",
};

const statusLabel: Record<Post["status"], string> = {
  draft: "Brouillon",
  scheduled: "Programmé",
  published: "Publié",
};

export default function AdminBlogPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/communications/notifications", label: "Communications" },
          { label: "Blog" },
        ]}
        title="Blog"
        description="Aucun CMS blog connecté pour l'instant."
        actions={
          <Button size="sm" disabled title="Édition du blog pas encore connectée à un backend">
            <Plus className="h-3.5 w-3.5" />
            Nouvel article
          </Button>
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Il n&apos;existe pas encore de table CMS pour le blog. Les articles ci-dessous sont des
          exemples illustratifs, pas des données réelles — créer, modifier ou supprimer un article
          n&apos;est pas encore possible depuis l&apos;admin.
        </p>
      </NotConnectedNotice>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {examplePosts.map((p) => (
          <Card key={p.id}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-t-lg bg-n-100">
              <Image src={p.cover} alt="" fill sizes="400px" className="object-cover" />
              <div className="absolute top-2 left-2">
                <Pill tone={statusTone[p.status]} dot>
                  {statusLabel[p.status]}
                </Pill>
              </div>
            </div>
            <CardBody className="space-y-2">
              <p className="text-label uppercase tracking-wide text-n-500">{p.category}</p>
              <p className="line-clamp-2 text-body font-medium text-ink">{p.title}</p>
              <p className="line-clamp-2 text-body-sm text-n-500">{p.excerpt}</p>
              <p className="text-caption text-n-400">
                {p.author}
                {p.publishedAt
                  ? ` · publié le ${formatDate(p.publishedAt)}`
                  : p.scheduledFor
                    ? ` · prévu le ${formatDate(p.scheduledFor)}`
                    : " · brouillon"}{" "}
                · {p.readMin} min
              </p>
              <div className="flex items-center justify-between border-t border-n-100 pt-3">
                <Link
                  href={`/blog/${p.slug}`}
                  className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:text-primary-hover"
                >
                  <Eye className="h-3.5 w-3.5" /> Aperçu
                </Link>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" disabled>
                    <PencilLine className="h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  <Button variant="ghost" size="sm" disabled aria-label="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
