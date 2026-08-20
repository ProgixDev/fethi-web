"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  ImageIcon,
  PencilLine,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatDate } from "@/lib/utils/format";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: "Quartier" | "Vie locale" | "Produit" | "Manifeste" | "Coulisses";
  status: "draft" | "scheduled" | "published";
  cover: string;
  author: string;
  publishedAt?: string;
  scheduledFor?: string;
  readMin: number;
};

const initialPosts: Post[] = [
  {
    id: "p1",
    title: "Pourquoi MyStreet n’aura jamais de livraison",
    slug: "pas-de-livraison",
    excerpt:
      "Notre choix de fond, expliqué : pourquoi la rencontre à pied vaut mille colis et trois cents kilomètres de logistique.",
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
    excerpt:
      "Tour d’horizon des quinze trouvailles les plus marquantes du Vieux-Lille en avril.",
    category: "Quartier",
    status: "published",
    cover: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80",
    author: "Marie L.",
    publishedAt: "2026-04-22T10:00:00Z",
    readMin: 4,
  },
  {
    id: "p3",
    title: "L’art de fixer le bon prix entre voisins",
    slug: "fixer-bon-prix",
    excerpt:
      "Trois principes simples pour ni se brader ni faire fuir l’acheteur — recueillis auprès de nos vendeurs les plus actifs.",
    category: "Vie locale",
    status: "scheduled",
    cover: "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=1200&q=80",
    author: "Léa M.",
    scheduledFor: "2026-05-12T07:00:00Z",
    readMin: 5,
  },
  {
    id: "p4",
    title: "Les coulisses du paiement protégé",
    slug: "paiement-protege-coulisses",
    excerpt:
      "Comment Stripe Connect, l’escrow et notre équipe litiges travaillent ensemble pour que personne ne perde un euro.",
    category: "Produit",
    status: "draft",
    cover: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1200&q=80",
    author: "Karim B.",
    readMin: 7,
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
  const [posts, setPosts] = React.useState<Post[]>(initialPosts);
  const [editing, setEditing] = React.useState<Post | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  function startNew() {
    setEditing({
      id: `p${Date.now()}`,
      title: "",
      slug: "",
      excerpt: "",
      category: "Quartier",
      status: "draft",
      cover: "",
      author: "Fethi",
      readMin: 5,
    });
    setShowForm(true);
  }

  function save() {
    if (!editing) return;
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === editing.id);
      return exists ? prev.map((p) => (p.id === editing.id ? editing : p)) : [editing, ...prev];
    });
    setEditing(null);
    setShowForm(false);
  }

  function remove(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/communications/notifications", label: "Communications" },
          { label: "Blog" },
        ]}
        title="Blog"
        description={`${posts.length} articles · ${posts.filter((p) => p.status === "published").length} publiés`}
        actions={
          <Button size="sm" onClick={startNew}>
            <Plus className="h-3.5 w-3.5" />
            Nouvel article
          </Button>
        }
      />

      {showForm && editing ? (
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-h3 font-medium text-ink">
                {posts.some((p) => p.id === editing.id) ? "Modifier l’article" : "Nouvel article"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setShowForm(false);
                }}
              >
                Annuler
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Titre" required>
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      title: e.currentTarget.value,
                      slug:
                        editing.slug ||
                        e.currentTarget.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                    })
                  }
                  placeholder="Ex. : Vieux-Lille en quinze annonces"
                />
              </Field>
              <Field label="Slug (URL)" hint="/blog/votre-slug">
                <Input
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.currentTarget.value })}
                  placeholder="vieux-lille-quinze-annonces"
                />
              </Field>
              <Field label="Catégorie">
                <Select
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.currentTarget.value as Post["category"] })
                  }
                >
                  <option>Quartier</option>
                  <option>Vie locale</option>
                  <option>Produit</option>
                  <option>Manifeste</option>
                  <option>Coulisses</option>
                </Select>
              </Field>
              <Field label="Statut">
                <Select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.currentTarget.value as Post["status"] })
                  }
                >
                  <option value="draft">Brouillon</option>
                  <option value="scheduled">Programmé</option>
                  <option value="published">Publié</option>
                </Select>
              </Field>
              <Field label="URL de la photo de couverture" className="lg:col-span-2">
                <Input
                  value={editing.cover}
                  onChange={(e) => setEditing({ ...editing, cover: e.currentTarget.value })}
                  placeholder="https://images.unsplash.com/…"
                  leadingIcon={<ImageIcon className="h-4 w-4" />}
                />
              </Field>
              <Field label="Extrait" className="lg:col-span-2">
                <Textarea
                  value={editing.excerpt}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.currentTarget.value })}
                  rows={3}
                  placeholder="Une ou deux phrases pour donner envie de lire."
                />
              </Field>
            </div>

            {editing.cover ? (
              <div className="overflow-hidden rounded-lg border border-n-100">
                <div className="relative aspect-[16/9] bg-n-100">
                  <Image
                    src={editing.cover}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 800px, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-n-200 bg-paper py-10 text-body-sm text-n-500 hover:border-primary hover:bg-primary-soft/30"
              >
                <Upload className="h-4 w-4" />
                Téléverser une image (Unsplash, Cloudinary, etc.)
              </button>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setShowForm(false);
                }}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={save} disabled={!editing.title.trim()}>
                Enregistrer
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <Card key={p.id}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-t-lg bg-n-100">
              {p.cover ? (
                <Image src={p.cover} alt="" fill sizes="400px" className="object-cover" />
              ) : null}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(p);
                      setShowForm(true);
                    }}
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(p.id)}
                    aria-label="Supprimer"
                  >
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
