"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

// Cette page liste les conversations d'un utilisateur. Pas d'endpoint admin
// dédié pour /admin/users/:id/threads — sera ajouté en V2 du backend.
// En attendant, on affiche un placeholder explicite (pas de données factices).
export default function UserMessagesPage() {
  return (
    <EmptyState
      icon={<MessageSquare className="h-5 w-5" />}
      title="Module messagerie en cours"
      description="L'endpoint /admin/users/{id}/threads sera ajouté dans la prochaine itération du backend. Le journal d'activité et les commandes restent visibles dans les autres onglets."
    />
  );
}
