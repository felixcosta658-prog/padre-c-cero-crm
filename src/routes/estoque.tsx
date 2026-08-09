import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Minus, Trash2, PackageSearch } from "lucide-react";
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
import { seedStock, uid, useCollection, type StockItem } from "@/lib/crm-store";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque de Materiais | Padre Cícero" },
      { name: "description", content: "Monitoramento de verniz, sacos, fita adesiva, lixas e demais materiais." },
      { property: "og:title", content: "Estoque de Materiais | Padre Cícero" },
      { property: "og:description", content: "Controle os níveis mínimos e o consumo de materiais da fábrica." },
    ],
  }),
  component: EstoquePage,
});

const novo = (): StockItem => ({
  id: uid(),
  nome: "",
  unidade: "un",
  quantidade: 0,
  minimo: 10,
  fornecedor: "",
});

function EstoquePage() {
  const { items, add, update, remove } = useCollection<StockItem>("crm.stock", seedStock);
  const [draft, setDraft] = useState<StockItem | null>(null);
  const baixos = items.filter((i) => i.quantidade <= i.minimo);

  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle="Materiais de produção e acabamento"
        action={
          <Button className="shrink-0" onClick={() => setDraft(novo())}>
            <Plus className="h-4 w-4" /> Novo material
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Materiais cadastrados" value={String(items.length)} icon={PackageSearch} />
        <StatCard
          label="Abaixo do mínimo"
          value={String(baixos.length)}
          hint={baixos.map((b) => b.nome).join(", ") || "Nenhum"}
          icon={PackageSearch}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((s) => {
          const baixo = s.quantidade <= s.minimo;
          return (
            <article key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{s.nome}</h2>
                  <p className="truncate text-xs text-muted-foreground">{s.fornecedor || "Sem fornecedor"}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    remove(s.id);
                    toast.success("Material removido");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <p className="mt-4 text-2xl font-bold">
                {s.quantidade}
                <span className="ml-1 text-sm font-medium text-muted-foreground">{s.unidade}</span>
              </p>
              <p
                className={`mt-1 text-xs font-medium ${baixo ? "text-accent" : "text-muted-foreground"}`}
              >
                {baixo ? "Repor estoque" : "Nível adequado"} · mínimo {s.minimo}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update(s.id, { quantidade: Math.max(0, s.quantidade - 1) })}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  className="h-9 w-24"
                  value={s.quantidade}
                  onChange={(e) => update(s.id, { quantidade: Number(e.target.value) })}
                />
                <Button size="sm" onClick={() => update(s.id, { quantidade: s.quantidade + 1 })}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {draft && (
        <Dialog open onOpenChange={(o) => !o && setDraft(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo material</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Unidade</Label>
                <Input value={draft.unidade} onChange={(e) => setDraft({ ...draft, unidade: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quantidade</Label>
                <Input
                  type="number"
                  value={draft.quantidade}
                  onChange={(e) => setDraft({ ...draft, quantidade: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Estoque mínimo</Label>
                <Input
                  type="number"
                  value={draft.minimo}
                  onChange={(e) => setDraft({ ...draft, minimo: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Fornecedor</Label>
                <Input
                  value={draft.fornecedor}
                  onChange={(e) => setDraft({ ...draft, fornecedor: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!draft.nome.trim()) {
                    toast.error("Informe o nome do material.");
                    return;
                  }
                  add(draft);
                  setDraft(null);
                  toast.success("Material cadastrado");
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
