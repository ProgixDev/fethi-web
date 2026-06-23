"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Users,
  Tag,
  ShieldAlert,
  ShoppingBag,
  Scale,
  Banknote,
  IdCard,
  BarChart3,
  Megaphone,
  Settings,
  HelpCircle,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { Mark, Wordmark } from "@/components/shared/Wordmark";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { hasRole, type StaffRole } from "@/lib/auth";

type LeafItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

type GroupItem = {
  key: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  /** When any child path is active, the group auto-expands. */
  base: string;
  children: { href: string; label: string; badge?: number }[];
};

type NavEntry = LeafItem | GroupItem;
type NavSection = { label?: string; items: NavEntry[] };

const sections: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/activity", label: "Activité", icon: Activity },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { href: "/users", label: "Utilisateurs", icon: Users },
      {
        key: "listings",
        label: "Annonces",
        icon: Tag,
        base: "/listings",
        children: [
          { href: "/listings", label: "Toutes les annonces" },
          { href: "/listings/grid", label: "Vue grille" },
          { href: "/listings/pending", label: "En attente", badge: 2 },
          { href: "/listings/featured", label: "À la une" },
          { href: "/listings/categories", label: "Catégories" },
        ],
      },
      {
        key: "moderation",
        label: "Modération",
        icon: ShieldAlert,
        badge: 7,
        base: "/moderation",
        children: [
          { href: "/moderation", label: "Signalements" },
          { href: "/moderation/flagged", label: "Annonces flaguées" },
          { href: "/moderation/blocked", label: "Comptes bannis" },
          { href: "/moderation/policies", label: "Politiques" },
          { href: "/moderation/audit", label: "Audit" },
        ],
      },
      { href: "/orders", label: "Commandes", icon: ShoppingBag },
      { href: "/disputes", label: "Litiges", icon: Scale, badge: 3 },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        key: "finance",
        label: "Finance",
        icon: Banknote,
        base: "/finance",
        children: [
          { href: "/finance", label: "Vue d’ensemble" },
          { href: "/finance/payouts", label: "Versements" },
          { href: "/finance/subscriptions", label: "Abonnements" },
          { href: "/finance/invoices", label: "Factures" },
          { href: "/finance/tax", label: "TVA" },
          { href: "/finance/stripe-sync", label: "Stripe sync" },
        ],
      },
      {
        key: "kyc",
        label: "KYC",
        icon: IdCard,
        badge: 12,
        base: "/kyc",
        children: [
          { href: "/kyc", label: "File d’attente", badge: 12 },
          { href: "/kyc/verified", label: "Vérifiés" },
          { href: "/kyc/appeals", label: "Recours" },
        ],
      },
    ],
  },
  {
    label: "Croissance",
    items: [
      {
        key: "analytics",
        label: "Analytics",
        icon: BarChart3,
        base: "/analytics",
        children: [
          { href: "/analytics/users", label: "Utilisateurs" },
          { href: "/analytics/listings", label: "Annonces" },
          { href: "/analytics/marketplace", label: "Marketplace" },
          { href: "/analytics/engagement", label: "Engagement" },
          { href: "/analytics/geo", label: "Géographie" },
          { href: "/analytics/reports", label: "Rapports" },
        ],
      },
      {
        key: "communications",
        label: "Communications",
        icon: Megaphone,
        base: "/communications",
        children: [
          { href: "/communications/notifications", label: "Notifications" },
          { href: "/communications/templates", label: "Modèles" },
          { href: "/communications/announcements", label: "Annonces in-app" },
          { href: "/communications/blog", label: "Blog" },
          { href: "/communications/support", label: "Support" },
        ],
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        key: "settings",
        label: "Paramètres",
        icon: Settings,
        base: "/settings",
        children: [
          { href: "/settings/system", label: "Système" },
          { href: "/settings/categories", label: "Catégories" },
          { href: "/settings/cities", label: "Villes" },
          { href: "/settings/feature-flags", label: "Feature flags" },
          { href: "/settings/integrations", label: "Intégrations" },
          { href: "/settings/audit", label: "Audit" },
          { href: "/settings/webhooks", label: "Webhooks" },
          { href: "/settings/api-keys", label: "Clés API" },
        ],
      },
      { href: "/docs", label: "Aide & docs", icon: HelpCircle },
    ],
  },
];

function isLeaf(e: NavEntry): e is LeafItem {
  return "href" in e;
}

const STORAGE_KEY = "mystreet:admin-sidebar-collapsed";

// Role gates by route prefix. `admin` always sees everything; ungated routes are
// visible to all staff. The REAL access enforcement is server-side (lib/auth +
// the (authed) guard) — this only hides links a member can't use.
const ROLE_GATES: { prefix: string; roles: StaffRole[] }[] = [
  { prefix: "/moderation", roles: ["moderator"] },
  { prefix: "/listings", roles: ["moderator"] },
  { prefix: "/kyc", roles: ["moderator", "finance"] },
  { prefix: "/orders", roles: ["finance"] },
  { prefix: "/finance", roles: ["finance"] },
  { prefix: "/refunds", roles: ["finance"] },
  { prefix: "/disputes", roles: ["moderator", "finance"] },
  { prefix: "/settings", roles: ["admin"] },
];

function canSee(href: string, roles: StaffRole[]): boolean {
  const gate = ROLE_GATES.find((g) => href.startsWith(g.prefix));
  return gate ? hasRole(roles, ...gate.roles) : true;
}

export function AdminSidebar({ roles }: { roles: StaffRole[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const visibleSections = React.useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            canSee("href" in item ? item.href : item.base, roles),
          ),
        }))
        .filter((section) => section.items.length > 0),
    [roles],
  );

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await createClient().auth.signOut();
    } catch {
      // ignore — on déconnecte localement de toute façon
    }
    router.push("/login");
    router.refresh();
  }

  // Hydrate persisted preference. Default = expanded.
  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
      /* private mode — ignore */
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <aside
      data-collapsed={collapsed || undefined}
      className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-n-100 bg-surface transition-[width] duration-200 ease-out",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 border-b border-n-100",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            aria-label="Déplier la barre latérale"
            title="Déplier"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-n-500 hover:bg-n-100 hover:text-n-700"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <>
            <Mark size={24} />
            <Wordmark className="text-[1.25rem]" />
            <button
              type="button"
              onClick={toggle}
              aria-label="Replier la barre latérale"
              title="Replier"
              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-n-500 hover:bg-n-100 hover:text-n-700"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {visibleSections.map((section, si) => (
          <div key={si} className={cn("mb-4 last:mb-0", section.label && "mt-1")}>
            {section.label && !collapsed ? (
              <p className="px-2 mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-n-400">
                {section.label}
              </p>
            ) : null}
            {section.label && collapsed && si > 0 ? (
              // Replace section label with a thin divider when collapsed so
              // groupings stay visually present without taking horizontal space.
              <div className="mx-2 mb-2 h-px bg-n-100" aria-hidden />
            ) : null}
            <ul className="space-y-px">
              {section.items.map((item) =>
                isLeaf(item) ? (
                  <LeafLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                  />
                ) : (
                  <GroupNav
                    key={item.key}
                    group={item}
                    pathname={pathname}
                    collapsed={collapsed}
                  />
                ),
              )}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-n-100", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Link
              href="/profile"
              title="Profil"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-caption font-semibold hover:opacity-90"
            >
              FA
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Se déconnecter"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-n-500 hover:bg-n-100 hover:text-danger disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md p-2 hover:bg-n-50">
            <Link
              href="/profile"
              title="Profil"
              className="flex flex-1 min-w-0 items-center gap-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent text-caption font-semibold">
                FA
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-body-sm font-medium text-ink">
                  Admin MyStreet
                </span>
                <span className="block truncate text-caption text-n-500">
                  Espace équipe
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-n-500 hover:bg-n-100 hover:text-danger disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function LeafLink({
  item,
  pathname,
  collapsed,
}: {
  item: LeafItem;
  pathname: string;
  collapsed: boolean;
}) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center rounded-md text-body-sm font-medium transition-colors",
          collapsed ? "h-9 justify-center" : "gap-2.5 px-2 py-1.5",
          active
            ? "bg-primary-soft text-primary-ink"
            : "text-n-700 hover:bg-n-50 hover:text-ink",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-primary" : "text-n-500 group-hover:text-n-700",
          )}
        />
        {collapsed ? null : <span className="flex-1">{item.label}</span>}
        {item.badge ? (
          collapsed ? (
            // Collapsed: tiny corner dot — keeps badge presence without text
            <span
              className={cn(
                "absolute right-1 top-1 h-1.5 w-1.5 rounded-full",
                active ? "bg-primary" : "bg-primary",
              )}
              aria-label={`${item.badge} en attente`}
            />
          ) : (
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px] font-medium tabular",
                active ? "bg-primary text-white" : "bg-n-100 text-n-600",
              )}
            >
              {item.badge}
            </span>
          )
        ) : null}
      </Link>
    </li>
  );
}

function GroupNav({
  group,
  pathname,
  collapsed,
}: {
  group: GroupItem;
  pathname: string;
  collapsed: boolean;
}) {
  const containsActive =
    pathname === group.base || pathname.startsWith(group.base + "/");
  const [open, setOpen] = React.useState<boolean>(containsActive);

  React.useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const Icon = group.icon;

  // When the sidebar is collapsed the group icon becomes a direct link to the
  // group's base route (sub-nav is unreachable until the user re-expands the
  // sidebar). This keeps the collapsed rail usable without opening any flyout.
  if (collapsed) {
    return (
      <li>
        <Link
          href={group.base}
          title={group.label}
          className={cn(
            "group relative flex h-9 items-center justify-center rounded-md text-body-sm font-medium transition-colors",
            containsActive
              ? "bg-primary-soft text-primary-ink"
              : "text-n-700 hover:bg-n-50 hover:text-ink",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              containsActive ? "text-primary" : "text-n-500 group-hover:text-n-700",
            )}
          />
          {group.badge ? (
            <span
              className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary"
              aria-label={`${group.badge} en attente`}
            />
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-body-sm font-medium transition-colors",
          containsActive
            ? "bg-primary-soft text-primary-ink"
            : "text-n-700 hover:bg-n-50 hover:text-ink",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            containsActive ? "text-primary" : "text-n-500 group-hover:text-n-700",
          )}
        />
        <span className="flex-1 text-left">{group.label}</span>
        {group.badge ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[10px] font-medium tabular",
              containsActive ? "bg-primary text-white" : "bg-n-100 text-n-600",
            )}
          >
            {group.badge}
          </span>
        ) : null}
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-n-400 transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <ul className="ml-3.5 mt-px space-y-px overflow-hidden border-l border-n-100 pl-2.5">
          {group.children.map((c) => {
            const active =
              pathname === c.href ||
              (c.href !== group.base && pathname.startsWith(c.href + "/"));
            return (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-body-sm transition-colors",
                    active
                      ? "font-medium text-primary-ink"
                      : "text-n-600 hover:bg-n-50 hover:text-ink",
                  )}
                >
                  <span className="flex-1">{c.label}</span>
                  {c.badge ? (
                    <span className="rounded-full bg-n-100 px-1.5 py-px text-[10px] font-medium tabular text-n-600">
                      {c.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}
