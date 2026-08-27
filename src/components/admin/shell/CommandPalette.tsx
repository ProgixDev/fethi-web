"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
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
  Activity,
} from "lucide-react";

type Ctx = { open: () => void; close: () => void; isOpen: boolean };
const PaletteCtx = React.createContext<Ctx>({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export function useCommandPalette() {
  return React.useContext(PaletteCtx);
}

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, group: "Navigation" },
  { href: "/activity", label: "Activité", icon: Activity, group: "Navigation" },
  { href: "/users", label: "Utilisateurs", icon: Users, group: "Navigation" },
  { href: "/listings", label: "Annonces", icon: Tag, group: "Navigation" },
  { href: "/moderation", label: "Modération", icon: ShieldAlert, group: "Navigation" },
  { href: "/orders", label: "Commandes", icon: ShoppingBag, group: "Navigation" },
  { href: "/disputes", label: "Litiges", icon: Scale, group: "Navigation" },
  { href: "/finance", label: "Finance", icon: Banknote, group: "Navigation" },
  { href: "/kyc", label: "KYC", icon: IdCard, group: "Navigation" },
  { href: "/analytics/users", label: "Analytics — Utilisateurs", icon: BarChart3, group: "Analytics" },
  { href: "/analytics/listings", label: "Analytics — Annonces", icon: BarChart3, group: "Analytics" },
  { href: "/analytics/marketplace", label: "Analytics — Marketplace", icon: BarChart3, group: "Analytics" },
  { href: "/analytics/geo", label: "Analytics — Géographie", icon: BarChart3, group: "Analytics" },
  { href: "/communications/notifications", label: "Composer une notification", icon: Megaphone, group: "Communications" },
  { href: "/communications/templates", label: "Modèles de message", icon: Megaphone, group: "Communications" },
  { href: "/settings/system", label: "Paramètres système", icon: Settings, group: "Paramètres" },
];

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((o) => !o);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctx = React.useMemo<Ctx>(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen],
  );

  return (
    <PaletteCtx.Provider value={ctx}>
      {children}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <button
              aria-label="Fermer"
              className="absolute inset-0 bg-overlay"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-xl border border-n-100 bg-surface shadow-strong"
            >
              <Command label="Recherche">
                <Command.Input
                  placeholder="Rechercher utilisateurs, annonces, pages…"
                  className="h-12 w-full border-b border-n-100 bg-transparent px-4 text-body text-ink placeholder:text-n-400 outline-none"
                />
                <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                  <Command.Empty className="px-3 py-8 text-center text-body-sm text-n-500">
                    Aucun résultat.
                  </Command.Empty>
                  {Array.from(new Set(navItems.map((n) => n.group))).map((group) => (
                    <Command.Group key={group} heading={group} className="mb-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-n-400">
                      {navItems
                        .filter((n) => n.group === group)
                        .map((n) => {
                          const Icon = n.icon;
                          return (
                            <Command.Item
                              key={n.href}
                              value={`${n.label} ${n.group}`}
                              onSelect={() => {
                                setIsOpen(false);
                                router.push(n.href);
                              }}
                              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm text-n-700 cursor-pointer aria-selected:bg-primary-soft aria-selected:text-primary-ink"
                            >
                              <Icon className="h-4 w-4 text-n-500 aria-selected:text-primary" />
                              {n.label}
                            </Command.Item>
                          );
                        })}
                    </Command.Group>
                  ))}
                </Command.List>
              </Command>
              <div className="flex items-center justify-between border-t border-n-100 bg-paper px-3 py-2 text-caption text-n-500">
                <span>↑↓ pour naviguer · ↵ pour ouvrir</span>
                <span>Esc pour fermer</span>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PaletteCtx.Provider>
  );
}
