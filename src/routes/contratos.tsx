import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { brl, fmtDate, seedContracts, uid, useCollection, type Contract } from "@/lib/crm-store";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos | Padre Cícero" },
      { name: "description", content: "Controle de contratos, vigência e valores dos clientes da fábrica." },
      { property: "og:title", content: "Contratos | Padre Cícero" },
      { property: "og:description", content: "Acompanhe contratos ativos e encerrados da fábrica de cabos." },
    ],
  }),
  component: ContratosPage,
});

const novo = (): Contract => ({
  id: uid(),
  createdAt: new Date().toISOString().slice(0, 10),
  numero: `CT-${Math.floor(1000 + Math.random() * 9000)}`,
  cliente: "",
  valor: 0,
  inicio: new Date().toISOString().slice(0, 10),
  fim: new Date().toISOString().slice(0, 10),
  status: "Ativo",
});

function ContratosPage() {
  const { items, add, update, remove } = useCollection<Contract>("crm.contracts", seedContracts);
  const [draft, setDraft] = useState<Contract | null>(null);

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle={`${items.length} contratos · ${brl(items.reduce((a, c) => a + c.valor, 0))}`}
        action={
          <Button className="shrink-0" onClick={() => setDraft(novo())}>
            <Plus className="h-4 w-4" /> Novo contrato
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Início</th>
              <th className="px-4 py-3">Fim</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium">{c.numero}</td>
                <td className="px-4 py-3">{c.cliente}</td>
                <td className="px-4 py-3">{fmtDate(c.inicio)}</td>
                <td className="px-4 py-3">{fmtDate(c.fim)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      update(c.id, { status: c.status === "Ativo" ? "Encerrado" : "Ativo" })
                    }
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.status === "Ativo"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.status}
                  </button>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{brl(c.valor)}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      remove(c.id);
                      toast.success("Contrato excluído");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <Dialog open onOpenChange={(o) => !o && setDraft(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo contrato</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Número</Label>
                <Input value={draft.numero} onChange={(e) => setDraft({ ...draft, numero: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <Input value={draft.cliente} onChange={(e) => setDraft({ ...draft, cliente: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Início</Label>
                <Input type="date" value={draft.inicio} onChange={(e) => setDraft({ ...draft, inicio: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fim</Label>
                <Input type="date" value={draft.fim} onChange={(e) => setDraft({ ...draft, fim: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number"
                  value={draft.valor}
                  onChange={(e) => setDraft({ ...draft, valor: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!draft.cliente.trim()) return toast.error("Informe o cliente.");
                  add(draft);
                  setDraft(null);
                  toast.success("Contrato cadastrado");
                }}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
