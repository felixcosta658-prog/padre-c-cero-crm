import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, PackageSearch, Phone, Mail, ShoppingCart, Globe } from "lucide-react";

import { PageHeader, StatCard } from "@/components/Shell";
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
import { useCollection, seedStock, logActivity, type StockItem } from "@/lib/crm-store";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque de Materiais | Padre Cícero" },
      {
        name: "description",
        content: "Estoque de materiais de produção e acabamento da Fábrica de Cabos Padre Cícero.",
      },
      {
        property: "og:title",
        content: "Estoque de Materiais | Padre Cícero",
      },
      {
        property: "og:description",
        content: "Materiais de produção e acabamento da fábrica de cabos em madeira.",
      },
    ],
  }),
  component: Estoque,
});

type StockDraft = Omit<StockItem, "id">;

const emptyDraft = (): StockDraft => ({
  nome: "",
  unidade: "un",
  quantidade: 0,
  minimo: 10,
  fornecedor: "",
  fornecedorTelefone: "",
  fornecedorEmail: "",
  linkCompra: "",
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

function Estoque() {
  const stock = useCollection<StockItem>("crm.stock", seedStock);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [draft, setDraft] = useState<StockDraft>(emptyDraft());
  const [toRemove, setToRemove] = useState<StockItem | null>(null);

  const set = (patch: Partial<StockDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const abaixo = stock.items.filter((s) => s.quantidade <= s.minimo);

  const save = () => {
    if (!draft.nome.trim()) {
      toast.error("Informe o nome do material.");
      return;
    }
    if (editing) {
      stock.update(editing.id, draft);
      toast.success("Material atualizado");
      logActivity("estoque", `Material "${draft.nome}" atualizado`);
    } else {
      stock.add(draft);
      toast.success("Material cadastrado");
      logActivity("estoque", `Material "${draft.nome}" cadastrado`);
    }
    setOpen(false);
    setEditing(null);
  };

  const openEdit = (s: StockItem) => {
    setEditing(s);
    setDraft({
      nome: s.nome,
      unidade: s.unidade,
      quantidade: s.quantidade,
      minimo: s.minimo,
      fornecedor: s.fornecedor,
      fornecedorTelefone: s.fornecedorTelefone || "",
      fornecedorEmail: s.fornecedorEmail || "",
      linkCompra: s.linkCompra || "",
    });
    setOpen(true);
  };

  const remove = (s: StockItem) => {
    setToRemove(s);
  };

  const confirmRemove = () => {
    if (!toRemove) return;
    stock.remove(toRemove.id);
    toast.success("Material removido");
    logActivity("estoque", `Material "${toRemove.nome}" removido`);
    setToRemove(null);
  };

  const changeQty = (s: StockItem, delta: number) => {
    const novo = Math.max(0, s.quantidade + delta);
    stock.update(s.id, { quantidade: novo });
    logActivity("estoque", `Estoque de "${s.nome}" ${delta > 0 ? "aumentado" : "reduzido"} para ${novo} ${s.unidade}`);
  };

  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle="Materiais de produção e acabamento"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDraft(emptyDraft());
              setOpen(true);
            }}
          >
            <Plus />
            Novo material
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Materiais cadastrados"
          value={stock.items.length}
          hint="Itens em controle"
          icon={PackageSearch}
        />
        <StatCard
          label="Abaixo do mínimo"
          value={abaixo.length}
          hint={abaixo.length > 0 ? abaixo.map((s) => s.nome).join(", ") : "Nenhum"}
          icon={PackageSearch}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stock.items.map((s) => {
          const low = s.quantidade <= s.minimo;
          return (
            <Card key={s.id} className="shadow-card gap-4 rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{s.nome}</p>
                </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <div className="flex flex-col items-center gap-1.5 text-sm">
                      <span className="text-xs font-medium text-muted-foreground">
                        {s.fornecedor || "Sem fornecedor"}
                      </span>
                      {s.fornecedorTelefone && (
                        <a
                          href={`https://wa.me/55${s.fornecedorTelefone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-muted-foreground hover:text-accent"
                        >
                          <Phone className="size-4" />
                          {s.fornecedorTelefone}
                        </a>
                      )}
                      {s.fornecedorEmail && (
                        <a
                          href={`mailto:${s.fornecedorEmail}`}
                          className="flex items-center gap-2 break-all text-muted-foreground hover:text-accent"
                        >
                          <Mail className="size-4 shrink-0" />
                          {s.fornecedorEmail}
                        </a>
                      )}
                      {s.linkCompra && (
                        <a
                          href={s.linkCompra}
                          target="_blank"
                          rel="noreferrer"
                          title={s.linkCompra}
                          className="flex max-w-[180px] items-center gap-2 truncate text-muted-foreground hover:text-accent"
                        >
                          <Globe className="size-4 shrink-0" />
                          <span className="truncate">{s.linkCompra}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-accent"
                        onClick={() => openEdit(s)}
                        aria-label={`Editar ${s.nome}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10"
                        onClick={() => remove(s)}
                        aria-label={`Remover ${s.nome}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
              </div>

              <div>
                <p className="text-2xl font-bold">
                  {s.quantidade}{" "}
                  <span className="text-sm font-normal text-muted-foreground">{s.unidade}</span>
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    low ? "font-semibold text-accent" : "text-muted-foreground",
                  )}
                >
                  {low ? (
                    <>
                      Repor estoque · mínimo {s.minimo} {s.unidade}
                    </>
                  ) : (
                    "Nível adequado"
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeQty(s, -1)}
                  aria-label="Diminuir quantidade"
                >
                  −
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={s.quantidade}
                  onChange={(e) =>
                    stock.update(s.id, {
                      quantidade: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="h-9 w-24 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeQty(s, 1)}
                  aria-label="Aumentar quantidade"
                >
                  +
                </Button>
              </div>

              {low && s.fornecedorTelefone && (
                <Button
                  className="w-full"
                  asChild
                  variant={low ? "default" : "outline"}
                >
                  <a
                    href={`https://wa.me/55${(s.fornecedorTelefone || "").replace(
                      /\D/g,
                      "",
                    )}?text=${encodeURIComponent(
                      `Olá! Gostaria de repor o estoque de ${s.nome}.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ShoppingCart />
                    Comprar / contatar
                  </a>
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar material" : "Novo material"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Faça as modificações no material."
                : "Cadastre um material de produção ou acabamento."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                value={draft.nome}
                onChange={(e) => set({ nome: e.target.value })}
                placeholder="Nome do material"
              />
            </Field>
            <Field label="Unidade">
              <Input
                value={draft.unidade}
                onChange={(e) => set({ unidade: e.target.value })}
                placeholder="un"
              />
            </Field>
            <Field label="Quantidade">
              <Input
                type="number"
                min={0}
                value={draft.quantidade || ""}
                onChange={(e) => set({ quantidade: Number(e.target.value) || 0 })}
                placeholder="0"
              />
            </Field>
            <Field label="Estoque mínimo">
              <Input
                type="number"
                min={0}
                value={draft.minimo || ""}
                onChange={(e) => set({ minimo: Number(e.target.value) || 0 })}
                placeholder="10"
              />
            </Field>
            <Field label="Fornecedor" className="sm:col-span-2">
              <Input
                value={draft.fornecedor}
                onChange={(e) => set({ fornecedor: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </Field>
            <Field label="Telefone do fornecedor">
              <Input
                value={draft.fornecedorTelefone}
                onChange={(e) => set({ fornecedorTelefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </Field>
            <Field label="E-mail do fornecedor">
              <Input
                value={draft.fornecedorEmail}
                onChange={(e) => set({ fornecedorEmail: e.target.value })}
                placeholder="contato@fornecedor.com"
              />
            </Field>
            <Field label="Link de compra" className="sm:col-span-2">
              <Input
                value={draft.linkCompra}
                onChange={(e) => set({ linkCompra: e.target.value })}
                placeholder="https://site-do-fornecedor.com/produto"
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

      <Dialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remover material</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold">{toRemove?.nome}</span>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToRemove(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
