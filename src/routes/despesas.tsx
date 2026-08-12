import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2, Receipt, CheckCircle2, Users } from "lucide-react";

import { PageHeader, StatCard } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useCollection,
  brl,
  fmtDate,
  today,
  seedExpenses,
  seedEmployees,
  logActivity,
  type Expense,
} from "@/lib/crm-store";

export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas | Padre Cícero" },
      {
        name: "description",
        content: "Custos operacionais da Fábrica de Cabos Padre Cícero.",
      },
      {
        property: "og:title",
        content: "Despesas | Padre Cícero",
      },
      {
        property: "og:description",
        content: "Custos operacionais da fábrica de cabos em madeira.",
      },
    ],
  }),
  component: Despesas,
});

type ExpenseDraft = Omit<Expense, "id">;

const emptyDraft = (): ExpenseDraft => ({
  data: today(),
  descricao: "",
  categoria: "Matéria-prima",
  valor: 0,
  pago: false,
});

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground uppercase">{label}</Label>
      {children}
    </div>
  );
}

function Despesas() {
  const expenses = useCollection<Expense>("crm.expenses", seedExpenses);
  const employees = useCollection("crm.employees.v2", seedEmployees);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft());

  const set = (patch: Partial<ExpenseDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const total = expenses.items.reduce((s, e) => s + e.valor, 0);
  const emAberto = expenses.items.filter((e) => !e.pago).reduce((s, e) => s + e.valor, 0);
  const producaoDinheiro = employees.items.reduce((s, e) => s + e.producao * e.custo, 0);

  const save = () => {
    if (!draft.descricao.trim()) {
      toast.error("Informe a descrição.");
      return;
    }
    expenses.add(draft);
    toast.success("Despesa lançada");
    logActivity("despesa", `Despesa "${draft.descricao}" lançada`);
    setOpen(false);
  };

  const remove = (e: Expense) => {
    expenses.remove(e.id);
    toast.success("Despesa excluída");
    logActivity("despesa", `Despesa "${e.descricao}" excluída`);
  };

  const togglePago = (e: Expense) => {
    const next = !e.pago;
    expenses.update(e.id, { pago: next });
    toast.success(next ? "Despesa marcada como paga." : "Despesa marcada como em aberto.");
    logActivity("despesa", `Despesa "${e.descricao}" ${next ? "paga" : "em aberto"}`);
  };

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle="Custos operacionais da fábrica"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Nova despesa
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total lançado"
          value={brl(total)}
          hint={`${expenses.items.length} lançamentos`}
          icon={Receipt}
        />
        <StatCard
          label="Em aberto"
          value={brl(emAberto)}
          hint="Despesas ainda não pagas"
          icon={CheckCircle2}
        />
        <StatCard
          label="Funcionários"
          value={brl(producaoDinheiro)}
          hint="Soma da produção em dinheiro"
          icon={Users}
        />
      </div>

      <Card className="mt-6 rounded-2xl border bg-card p-0 shadow-card">
        <div className="p-3">
          <Table className="min-w-[680px]">
            <TableHeader className="bg-secondary/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{fmtDate(e.data)}</TableCell>
                  <TableCell className="font-medium">{e.descricao}</TableCell>
                  <TableCell className="text-muted-foreground">{e.categoria}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => togglePago(e)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                        e.pago
                          ? "bg-success/15 text-success hover:bg-success/25"
                          : "bg-warning/15 text-warning hover:bg-warning/25",
                      )}
                    >
                      {e.pago ? (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          Pago
                        </>
                      ) : (
                        "Em aberto"
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right font-bold">{brl(e.valor)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => remove(e)}
                        aria-label={`Excluir despesa ${e.descricao}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {expenses.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhuma despesa lançada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova despesa</DialogTitle>
            <DialogDescription>Lance um novo custo operacional.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data">
              <Input
                type="date"
                value={draft.data}
                onChange={(e) => set({ data: e.target.value })}
              />
            </Field>
            <Field label="Categoria">
              <Input
                value={draft.categoria}
                onChange={(e) => set({ categoria: e.target.value })}
                placeholder="Matéria-prima"
              />
            </Field>
            <Field label="Descrição" className="sm:col-span-2">
              <Input
                value={draft.descricao}
                onChange={(e) => set({ descricao: e.target.value })}
                placeholder="Descrição da despesa"
              />
            </Field>
            <Field label="Valor" className="sm:col-span-2">
              <Input
                type="number"
                min={0}
                value={draft.valor || ""}
                onChange={(e) => set({ valor: Number(e.target.value) || 0 })}
                placeholder="0"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
