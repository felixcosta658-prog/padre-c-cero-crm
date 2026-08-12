import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCollection, brl, fmtDate, today, seedEmployees, logActivity, type Employee } from "@/lib/crm-store";

export const Route = createFileRoute("/funcionarios")({
  head: () => ({
    meta: [
      { title: "Funcionários e Produção | Padre Cícero" },
      {
        name: "description",
        content: "Funcionários e produção mensal da Fábrica de Cabos Padre Cícero.",
      },
      {
        property: "og:title",
        content: "Funcionários e Produção | Padre Cícero",
      },
      {
        property: "og:description",
        content: "Funcionários e metas de produção da fábrica de cabos em madeira.",
      },
    ],
  }),
  component: Funcionarios,
});

type EmployeeDraft = Omit<Employee, "id">;

const emptyDraft = (): EmployeeDraft => ({
  nome: "",
  funcao: "",
  telefone: "",
  admissao: today(),
  meta: 300,
  producao: 0,
  custo: 0,
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

function Funcionarios() {
  const employees = useCollection<Employee>("crm.employees.v2", seedEmployees);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EmployeeDraft>(emptyDraft());
  const [custoText, setCustoText] = useState("");

  const set = (patch: Partial<EmployeeDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const openNew = () => {
    setDraft(emptyDraft());
    setCustoText("");
    setOpen(true);
  };

  const somaProducao = employees.items.reduce((s, e) => s + e.producao, 0);
  const somaMeta = employees.items.reduce((s, e) => s + e.meta, 0);

  const save = () => {
    if (!draft.nome.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    employees.add(draft);
    toast.success("Funcionário cadastrado");
    logActivity("funcionario", `Funcionário "${draft.nome}" cadastrado`);
    setOpen(false);
  };

  const remove = (e: Employee) => {
    employees.remove(e.id);
    toast.success("Funcionário removido");
    logActivity("funcionario", `Funcionário "${e.nome}" removido`);
  };

  const changeProducao = (e: Employee, delta: number) => {
    const novo = Math.max(0, e.producao + delta);
    employees.update(e.id, { producao: novo });
    logActivity("funcionario", `Produção de "${e.nome}" atualizada para ${novo}`);
  };

  return (
    <>
      <PageHeader
        title="Funcionários e Produção"
        subtitle={`${employees.items.length} colaboradores · ${somaProducao} de ${somaMeta} cabos produzidos`}
        action={
          <Button onClick={openNew}>
            <Plus />
            Cadastrar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {employees.items.map((e) => {
          const pct = Math.min(100, Math.round((e.producao / Math.max(1, e.meta)) * 100));
          const valorProducao = e.producao * e.custo;
          return (
            <Card key={e.id} className="shadow-card gap-4 rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{e.nome}</p>
                  <p className="text-xs text-muted-foreground">{e.funcao || "—"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => remove(e)}
                  aria-label={`Remover ${e.nome}`}
                >
                  <Trash2 />
                </Button>
              </div>

              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Telefone</dt>
                  <dd>{e.telefone || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Admissão</dt>
                  <dd>{fmtDate(e.admissao)}</dd>
                </div>
              </dl>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Produção do mês</span>
                  <span className="font-semibold">
                    {e.producao}/{e.meta}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pct >= 100 ? "bg-success" : "bg-primary",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {e.custo > 0 && (
                <div className="bg-success/10 rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground">Valor da produção</p>
                  <p className="text-success font-bold">{brl(valorProducao)}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeProducao(e, -10)}
                  aria-label="Diminuir produção"
                >
                  −10
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={e.producao}
                  onChange={(ev) =>
                    employees.update(e.id, {
                      producao: Math.max(0, Number(ev.target.value) || 0),
                    })
                  }
                  className="h-9 w-24 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeProducao(e, 10)}
                  aria-label="Aumentar produção"
                >
                  +10
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo funcionário</DialogTitle>
            <DialogDescription>Cadastre um colaborador e sua meta mensal.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                value={draft.nome}
                onChange={(e) => set({ nome: e.target.value })}
                placeholder="Nome completo"
              />
            </Field>
            <Field label="Função">
              <Input
                value={draft.funcao}
                onChange={(e) => set({ funcao: e.target.value })}
                placeholder="Ex: Torneiro"
              />
            </Field>
            <Field label="Telefone">
              <Input
                value={draft.telefone}
                onChange={(e) => set({ telefone: e.target.value })}
                placeholder="(88) 99999-0000"
              />
            </Field>
            <Field label="Admissão">
              <Input
                type="date"
                value={draft.admissao}
                onChange={(e) => set({ admissao: e.target.value })}
              />
            </Field>
            <Field label="Meta mensal">
              <Input
                type="number"
                min={0}
                value={draft.meta || ""}
                onChange={(e) => set({ meta: Number(e.target.value) || 0 })}
                placeholder="300"
              />
            </Field>
            <Field label="Custo por unidade (R$)">
              <Input
                type="text"
                inputMode="decimal"
                value={custoText}
                onChange={(e) => {
                  setCustoText(e.target.value);
                  const n = parseFloat(e.target.value.replace(",", "."));
                  set({ custo: Number.isNaN(n) ? 0 : n });
                }}
                placeholder="0,00"
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
