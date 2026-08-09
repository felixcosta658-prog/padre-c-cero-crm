import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Receipt, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/Shell";
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
import { brl, fmtDate, seedExpenses, uid, useCollection, type Expense } from "@/lib/crm-store";

export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas | Padre Cícero" },
      { name: "description", content: "Controle de despesas de matéria-prima, operação e manutenção da fábrica." },
      { property: "og:title", content: "Despesas | Padre Cícero" },
      { property: "og:description", content: "Registre e acompanhe os custos mensais da fábrica de cabos." },
    ],
  }),
  component: DespesasPage,
});

const nova = (): Expense => ({
  id: uid(),
  data: new Date().toISOString().slice(0, 10),
  descricao: "",
  categoria: "Matéria-prima",
  valor: 0,
  pago: false,
});

function DespesasPage() {
  const { items, add, update, remove } = useCollection<Expense>("crm.expenses", seedExpenses);
  const [draft, setDraft] = useState<Expense | null>(null);
  const total = items.reduce((a, e) => a + e.valor, 0);
  const aberto = items.filter((e) => !e.pago).reduce((a, e) => a + e.valor, 0);

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle="Custos operacionais da fábrica"
        action={
          <Button className="shrink-0" onClick={() => setDraft(nova())}>
            <Plus className="h-4 w-4" /> Nova despesa
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total lançado" value={brl(total)} icon={Receipt} />
        <StatCard label="Em aberto" value={brl(aberto)} hint="Despesas ainda não pagas" icon={CheckCircle2} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3">{fmtDate(e.data)}</td>
                <td className="px-4 py-3 font-medium">{e.descricao}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.categoria}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => update(e.id, { pago: !e.pago })}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      e.pago ? "bg-primary text-primary-foreground" : "bg-accent/15 text-accent"
                    }`}
                  >
                    {e.pago ? "Pago" : "Em aberto"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{brl(e.valor)}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      remove(e.id);
                      toast.success("Despesa excluída");
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
              <DialogTitle>Nova despesa</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data</Label>
                <Input type="date" value={draft.data} onChange={(e) => setDraft({ ...draft, data: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Input
                  value={draft.categoria}
                  onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Input
                  value={draft.descricao}
                  onChange={(e) => setDraft({ ...draft, descricao: e.target.value })}
                />
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
                  if (!draft.descricao.trim()) {
                    toast.error("Informe a descrição.");
                    return;
                  }
                  add(draft);
                  setDraft(null);
                  toast.success("Despesa lançada");
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
