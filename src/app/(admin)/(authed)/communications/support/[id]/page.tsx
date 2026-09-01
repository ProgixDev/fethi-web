"use client";

import * as React from "react";
import { useParams, notFound } from "next/navigation";
import { Send } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  supportApi,
  type SupportTicket,
  type SupportTicketMessage,
  type SupportTicketStatus,
} from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

const statusTone: Record<SupportTicketStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};
const statusLabel: Record<SupportTicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};
const ALL_STATUSES: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [ticket, setTicket] = React.useState<SupportTicket | null>(null);
  const [messages, setMessages] = React.useState<SupportTicketMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFoundFlag, setNotFoundFlag] = React.useState(false);
  const [reply, setReply] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const load = React.useCallback(() => {
    if (!id) return;
    Promise.all([supportApi.get(id), supportApi.listMessages(id)])
      .then(([t, msgs]) => {
        setTicket(t);
        setMessages(msgs);
      })
      .catch(() => setNotFoundFlag(true))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (next: SupportTicketStatus) => {
    if (!ticket) return;
    setPending(true);
    try {
      const updated = await supportApi.setStatus(ticket.id, next);
      setTicket(updated);
    } catch (err) {
      alert("Échec: " + (err as Error).message);
    } finally {
      setPending(false);
    }
  };

  const sendReply = async () => {
    if (!ticket || !reply.trim()) return;
    setPending(true);
    try {
      await supportApi.reply(ticket.id, reply.trim());
      setReply("");
      load();
    } catch (err) {
      alert("Échec: " + (err as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="container-admin py-8">
        <p className="text-body text-n-500">Chargement…</p>
      </div>
    );
  }
  if (notFoundFlag || !ticket) notFound();

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/communications/support", label: "Support" },
          { label: `#${ticket.id.slice(0, 8)}` },
        ]}
        title={ticket.subject}
        description={`Demande de ${ticket.requesterName}`}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-body-sm text-n-500">Aucun message.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-3 py-2 text-body-sm ${
                      m.senderRole === "STAFF"
                        ? "ml-8 bg-ink text-paper"
                        : "mr-8 bg-n-100 text-n-800"
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p
                      className={`mt-1 text-caption ${
                        m.senderRole === "STAFF" ? "text-paper/60" : "text-n-500"
                      }`}
                    >
                      {m.senderRole === "STAFF" ? "Support" : ticket.requesterName} ·{" "}
                      {formatDate(m.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.currentTarget.value)}
                placeholder="Répondre à cette demande…"
                rows={3}
                disabled={pending}
              />
              <div className="flex justify-end">
                <Button onClick={sendReply} disabled={pending || !reply.trim()}>
                  <Send className="h-4 w-4" />
                  Envoyer
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">Statut</span>
                <Pill tone={statusTone[ticket.status]} dot>
                  {statusLabel[ticket.status]}
                </Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">Ouvert le</span>
                <span className="text-body-sm text-n-700">{formatDate(ticket.createdAt)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <h3 className="text-h3 font-medium text-ink mb-2">Changer le statut</h3>
              {ALL_STATUSES.filter((s) => s !== ticket.status).map((s) => (
                <Button
                  key={s}
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus(s)}
                  disabled={pending}
                >
                  {statusLabel[s]}
                </Button>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
