"use client";

import * as React from "react";
import { Bell, Search, Command } from "lucide-react";
import { useCommandPalette } from "@/components/admin/shell/CommandPalette";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

export function AdminTopBar() {
  const { open } = useCommandPalette();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-n-100 bg-surface px-4 lg:px-6">
      <button
        type="button"
        onClick={open}
        className="hidden md:inline-flex h-9 w-[28rem] max-w-full items-center gap-2 rounded-md border border-n-200 bg-paper px-3 text-body-sm text-n-500 transition-colors hover:border-n-300"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left whitespace-nowrap">
          Rechercher utilisateurs, annonces, commandes…
        </span>
        <kbd className="inline-flex shrink-0 items-center gap-0.5 rounded border border-n-200 bg-surface px-1 py-0.5 text-[10px] font-medium text-n-500">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <button
        type="button"
        onClick={open}
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-n-200 bg-paper text-n-500"
        aria-label="Rechercher"
      >
        <Search className="h-4 w-4" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle size="sm" />
        <Link
          href="/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-n-500 hover:bg-n-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
