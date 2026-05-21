"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import {
  categoriesApi,
  Category,
  ListingType,
  ApiError,
} from "@/lib/api";

const typeLabels: Record<ListingType, string> = {
  VENTE: "Vente",
  LOCATION: "Location",
  SERVICE: "Service",
};

/**
 * Popup pour créer une catégorie OU éditer une catégorie existante.
 * Passe `category` pour le mode édition, undefined pour création.
 */
export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  category?: Category | null;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(category);

  const [slug, setSlug] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [labelEn, setLabelEn] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [glyph, setGlyph] = React.useState("");
  const [type, setType] = React.useState<ListingType>("VENTE");
  const [sortOrder, setSortOrder] = React.useState<number>(0);
  const [active, setActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Hydratation à chaque ouverture
  React.useEffect(() => {
    if (!open) return;
    if (category) {
      setSlug(category.slug);
      setLabel(category.label);
      setLabelEn("");
      setSubtitle(category.subtitle ?? "");
      setGlyph(category.glyph ?? "");
      setType(category.type);
      setSortOrder(category.sortOrder ?? 0);
      setActive(true); // pas exposé par CategoryResponse → on suppose true
    } else {
      setSlug("");
      setLabel("");
      setLabelEn("");
      setSubtitle("");
      setGlyph("");
      setType("VENTE");
      setSortOrder(0);
      setActive(true);
    }
    setError(null);
    setSubmitting(false);
  }, [open, category]);

  // Auto-slug depuis le label en mode création
  function onLabelChange(value: string) {
    setLabel(value);
    if (!isEdit && !slug) {
      const auto = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);
      setSlug(auto);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && category) {
        await categoriesApi.update(category.id, {
          label: label.trim(),
          labelEn: labelEn.trim() || undefined,
          subtitle: subtitle.trim() || undefined,
          glyph: glyph.trim() || undefined,
          sortOrder,
          active,
        });
      } else {
        await categoriesApi.create({
          slug: slug.trim(),
          label: label.trim(),
          labelEn: labelEn.trim() || undefined,
          subtitle: subtitle.trim() || undefined,
          glyph: glyph.trim() || undefined,
          type,
          sortOrder,
        });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Enregistrement impossible");
      } else {
        setError("Erreur réseau");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}
      description={
        isEdit
          ? "Les champs slug et type ne sont pas modifiables."
          : "Définit un nouveau bucket dans la taxonomie. Le slug doit être unique pour un type donné."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Libellé FR" required>
            <Input
              type="text"
              required
              placeholder="Vélo"
              value={label}
              onChange={(e) => onLabelChange(e.currentTarget.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Libellé EN">
            <Input
              type="text"
              placeholder="Bike"
              value={labelEn}
              onChange={(e) => setLabelEn(e.currentTarget.value)}
              maxLength={100}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Slug"
            required
            hint={isEdit ? "Non modifiable" : "minuscules, chiffres, tirets"}
          >
            <Input
              type="text"
              required
              placeholder="velo"
              value={slug}
              onChange={(e) => setSlug(e.currentTarget.value)}
              pattern="^[a-z0-9-]+$"
              maxLength={50}
              disabled={isEdit}
            />
          </Field>
          <Field label="Univers" required>
            <Select
              value={type}
              onChange={(e) => setType(e.currentTarget.value as ListingType)}
              disabled={isEdit}
            >
              {(Object.keys(typeLabels) as ListingType[]).map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Sous-titre">
          <Input
            type="text"
            placeholder="Vélos, trottinettes"
            value={subtitle}
            onChange={(e) => setSubtitle(e.currentTarget.value)}
            maxLength={200}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Icône (glyph)">
            <Input
              type="text"
              placeholder="bike"
              value={glyph}
              onChange={(e) => setGlyph(e.currentTarget.value)}
              maxLength={50}
            />
          </Field>
          <Field label="Ordre d'affichage">
            <Input
              type="number"
              value={String(sortOrder)}
              onChange={(e) =>
                setSortOrder(parseInt(e.currentTarget.value, 10) || 0)
              }
            />
          </Field>
        </div>

        {isEdit ? (
          <Field label="Active">
            <Toggle checked={active} onChange={setActive} />
          </Field>
        ) : null}

        {error ? (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-caption text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting
              ? "Enregistrement…"
              : isEdit
                ? "Enregistrer"
                : "Créer la catégorie"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
