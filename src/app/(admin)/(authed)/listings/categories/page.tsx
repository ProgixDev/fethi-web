import { redirect } from "next/navigation";

// This used to be a read-only, grouped-by-type browse view — a duplicate of
// /settings/categories, which is the real (CRUD) categories admin. Redirect
// here instead of maintaining two "Catégories" screens with different
// capabilities (#70 / #76.2).
export default function ListingsCategoriesPage() {
  redirect("/settings/categories");
}
