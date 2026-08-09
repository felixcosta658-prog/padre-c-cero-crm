import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Minus } from "lucide-react";
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
import { fmtDate, seedEmployees, uid, useCollection, type Employee } from "@/lib/crm-store";

export const Route = createFileRoute("/funcionarios")({
  head: () => ({
    meta: [
      { title: "Funcionários e Produção | Padre Cícero" },
      { name: "description", content: "Cadastro de funcionários e controle diário de produção de cabos." },
      { property: "og:title", content: "Funcionários e Produção | Padre Cícero" },
      { property: "og:description", content: "Acompanhe metas e produção da equipe da fábrica." },
    ],
  }),
  component: FuncionariosPage,
});

const novo = (): Employee => ({
  id: uid(),
  nome: "",
  funcao: "",
  telefone: "",
  admissao: new Date().toISOString().slice(0, 10),
  meta: 300,
  producao: 0,
});

function FuncionariosPage() {
  const { items, add, update, remove } = useCollection<Employee>("crm.employees", seedEmployees);
  const [draft, setDraft] = useState<Employee | null>(null);
  const totalProd = items.reduce((a, e) => a + e.producao, 0);
  const totalMeta = items.reduce((a, e) => a + e.meta, 0);

  return (
    <>
      <PageHeader
        title="Funcionários"
        subtitle={`${items.length} colaboradores · ${totalProd} de ${totalMeta} cabos produzidos`}
        action={
          <Button className="shrink-0" onClick={() => setDraft(novo())}>
            <Plus className="h-4 w-4" /> Cadastrar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((e) => {
          const pct = Math.min(100, Math.round((e.producao / Math.max(1, e.meta)) * 100));
          return (
            <article key={e.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{e.nome}</h2>
                  <p className="truncate text-xs text-muted-foreground">{e.funcao}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    remove(e.id);
                    toast.success("Funcionário removido");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <dt>Telefone</dt>
                  <dd className="text-foreground">{e.telefone || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Admissão</dt>
                  <dd className="text-foreground">{fmtDate(e.admissao)}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Produção do mês</span>
                  <span className="font-semibold">
                    {e.producao}/{e.meta}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${pct >= 100 ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update(e.id, { producao: Math.max(0, e.producao - 10) })}
                >
                  <Minus className="h-4 w-4" /> 10
                </Button>
                <Button size="sm" onClick={() => update(e.id, { producao: e.producao + 10 })}>
                  <Plus className="h-4 w-4" /> 10
                </Button>
                <Input
                  type="number"
                  className="h-9 w-24"
                  value={e.producao}
                  onChange={(ev) => update(e.id, { producao: Number(ev.target.value) })}
                />
              </div>
            </article>
          );
        })}
      </div>

      {draft && (
        <Dialog open onOpenChange={(o) => !o && setDraft(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo funcionário</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Função</Label>
                <Input value={draft.funcao} onChange={(e) => setDraft({ ...draft, funcao: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <Input value={draft.telefone} onChange={(e) => setDraft({ ...draft, telefone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Admissão</Label>
                <Input
                  type="date"
                  value={draft.admissao}
                  onChange={(e) => setDraft({ ...draft, admissao: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Meta mensal (cabos)</Label>
                <Input
                  type="number"
                  value={draft.meta}
                  onChange={(e) => setDraft({ ...draft, meta: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!draft.nome.trim()) return toast.error("Informe o nome.");
                  add(draft);
                  setDraft(null);
                  toast.success("Funcionário cadastrado");
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
