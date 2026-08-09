import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, BrandLogo } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  brl,
  fmtDate,
  seedContracts,
  uid,
  useCollection,
  normalizeContractStatus,
  CONTRACT_STATUSES,
  type Contract,
  type ContractStatus,
} from "@/lib/crm-store";
import { exportContractPdf } from "@/lib/pdf";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos | Padre Cícero" },
      {
        name: "description",
        content: "Controle de contratos, vigência e valores dos clientes da fábrica.",
      },
      { property: "og:title", content: "Contratos | Padre Cícero" },
      {
        property: "og:description",
        content: "Acompanhe contratos ativos, em produção e finalizados da fábrica de cabos.",
      },
    ],
  }),
  component: ContratosPage,
});

const novo = (): Contract => ({
  id: uid(),
  createdAt: new Date().toISOString().slice(0, 10),
  numero: `CT-${Math.floor(1000 + Math.random() * 9000)}`,
  quantidade: 0,
  cliente: "",
  valor: 0,
  inicio: new Date().toISOString().slice(0, 10),
  fim: new Date().toISOString().slice(0, 10),
  status: "Ativo",
  observacoes: "",
});

const columnTone: Record<ContractStatus, string> = {
  Ativo: "bg-primary text-primary-foreground",
  "Em produção": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Finalizado: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const columnBg: Record<ContractStatus, string> = {
  Ativo: "bg-secondary/40",
  "Em produção": "bg-amber-500/5 border-amber-900/15 dark:border-amber-400/20",
  Finalizado: "bg-emerald-500/5 border-emerald-900/15 dark:border-emerald-400/20",
};

const columnDot: Record<ContractStatus, string> = {
  Ativo: "bg-primary",
  "Em produção": "bg-amber-500/70",
  Finalizado: "bg-emerald-500/70",
};

function ContratosPage() {
  const { items, add, update, remove } = useCollection<Contract>("crm.contracts", seedContracts);
  const [draft, setDraft] = useState<Contract | null>(null);
  const [viewing, setViewing] = useState<Contract | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const isEdit = draft ? items.some((i) => i.id === draft.id) : false;

  const save = () => {
    if (!draft) return;
    if (!draft.cliente.trim()) {
      toast.error("Informe o cliente.");
      return;
    }
    const next = { ...draft, quantidade: Number(draft.quantidade) || 0 };
    if (isEdit) {
      update(draft.id, next);
      toast.success("Contrato atualizado");
    } else {
      add(next);
      toast.success("Contrato cadastrado");
    }
    setDraft(null);
  };

  const openEdit = (c: Contract) => setDraft({ ...c, quantidade: Number(c.quantidade) || 0 });

  const onDrop = (status: ContractStatus) => {
    if (!dragging) return;
    update(dragging, { status });
    setDragging(null);
    toast.success(`Movido para "${CONTRACT_STATUSES.find((s) => s.id === status)?.label}"`);
  };

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

      <div className="grid gap-4 md:grid-cols-3">
        {CONTRACT_STATUSES.map((col) => {
          const cards = items.filter((c) => normalizeContractStatus(c.status) === col.id);
          const idx = CONTRACT_STATUSES.findIndex((s) => s.id === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
              className={`flex min-h-[260px] flex-col rounded-2xl border border-border p-3 ${columnBg[col.id]}`}
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${columnDot[col.id]}`} />
                  <span className="truncate text-sm font-semibold">{col.label}</span>
                </div>
                <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {cards.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {cards.map((c) => (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={() => setDragging(c.id)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => setViewing(c)}
                    className="cursor-pointer rounded-xl border border-border bg-card p-3 shadow-card transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.numero}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.cliente || "Sem cliente"}
                        </p>
                        {c.quantidade > 0 && (
                          <p className="truncate text-xs font-medium text-primary">
                            {c.quantidade} un.
                          </p>
                        )}
                      </div>
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${columnTone[col.id]}`}
                      >
                        {col.label}
                      </span>
                      <span className="text-xs font-semibold">{brl(c.valor)}</span>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {fmtDate(c.inicio)} → {fmtDate(c.fim)}
                    </p>

                    {c.observacoes && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {c.observacoes}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-1 border-t border-border pt-2">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={idx === 0}
                          aria-label="Mover para coluna anterior"
                          onClick={(e) => {
                            e.stopPropagation();
                            update(c.id, { status: CONTRACT_STATUSES[idx - 1]!.id });
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={idx === CONTRACT_STATUSES.length - 1}
                          aria-label="Mover para próxima coluna"
                          onClick={(e) => {
                            e.stopPropagation();
                            update(c.id, { status: CONTRACT_STATUSES[idx + 1]!.id });
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Clique para visualizar
                      </span>
                    </div>
                  </article>
                ))}

                {cards.length === 0 && (
                  <div className="grid min-h-[120px] place-items-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                    Nenhum contrato
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {viewing && (
        <Dialog open onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-center">Pedido no {viewing.numero}</DialogTitle>
            </DialogHeader>

            <div className="overflow-hidden rounded-xl border border-border bg-white text-[#2D3338] shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-primary px-5 py-4 text-primary-foreground">
                <div className="flex min-w-0 items-center gap-3">
                  <BrandLogo size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-primary-foreground/70">
                      Fábrica de cabos
                    </p>
                    <p className="truncate text-lg font-extrabold leading-tight text-accent">
                      Padre Cícero
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">Contrato de Fornecimento</p>
                  <p className="mt-0.5 text-xs text-primary-foreground/70">
                    Emitido em {fmtDate(viewing.createdAt)}
                  </p>
                  <p className="text-xs text-primary-foreground/70">Pedido no {viewing.numero}</p>
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="mb-2 border-b-2 border-primary/20 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-primary">
                  Dados do cliente
                </p>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  {[
                    ["Razão Social / Nome", viewing.cliente || "—"],
                    ["E-mail", "—"],
                    ["Telefone", "—"],
                    ["CNPJ / CPF", "—"],
                    ["Endereço", "—"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-4 py-0.5 text-sm"
                    >
                      <span className="shrink-0 text-xs text-muted-foreground">{k}</span>
                      <span className="truncate font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border px-5 py-4">
                <p className="mb-2 border-b-2 border-primary/20 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-primary">
                  Detalhes do contrato
                </p>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div className="flex items-baseline justify-between gap-4 py-0.5 text-sm">
                    <span className="shrink-0 text-xs text-muted-foreground">Data de Início</span>
                    <span className="font-medium">{fmtDate(viewing.inicio)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 py-0.5 text-sm">
                    <span className="shrink-0 text-xs text-muted-foreground">Data de Entrega</span>
                    <span className="font-medium">{fmtDate(viewing.fim)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 py-0.5 text-sm">
                    <span className="shrink-0 text-xs text-muted-foreground">Quantidade</span>
                    <span className="font-medium">{viewing.quantidade} un.</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 py-0.5 text-sm">
                    <span className="shrink-0 text-xs text-muted-foreground">Valor Total</span>
                    <span className="font-bold">{brl(viewing.valor)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 py-0.5 text-sm">
                    <span className="shrink-0 text-xs text-muted-foreground">Status</span>
                    <span className="font-medium">
                      {normalizeContractStatus(viewing.status) === "Finalizado"
                        ? "Finalizados"
                        : normalizeContractStatus(viewing.status)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Descrição | Anotações do Pedido
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{viewing.observacoes || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-border px-5 py-5 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Assinatura do Fornecedor</p>
                  <p className="mt-1 font-semibold">Fábrica Padre Cicero</p>
                  <div className="mt-4 border-t border-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assinatura do Cliente</p>
                  <p className="mt-1 font-semibold">{viewing.cliente || "—"}</p>
                  <div className="mt-4 border-t border-primary" />
                </div>
              </div>

              <p className="bg-primary px-5 py-2.5 text-center text-[11px] font-medium text-primary-foreground/80">
                Documento gerado automaticamente pelo sistema ERP - Fábrica Padre Cícero
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                className="mr-auto text-destructive hover:bg-destructive/10"
                onClick={() => {
                  remove(viewing.id);
                  setViewing(null);
                  toast.success("Contrato excluído");
                }}
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
              <Button variant="outline" onClick={() => openEdit(viewing)}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  exportContractPdf(viewing);
                  toast.success("Contrato exportado para PDF");
                }}
              >
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button onClick={() => setViewing(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {draft && (
        <Dialog open onOpenChange={(o) => !o && setDraft(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEdit ? "Editar contrato" : "Novo contrato"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Número</Label>
                <Input
                  value={draft.numero}
                  onChange={(e) => setDraft({ ...draft, numero: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <Input
                  value={draft.cliente}
                  onChange={(e) => setDraft({ ...draft, cliente: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Início</Label>
                <Input
                  type="date"
                  value={draft.inicio}
                  onChange={(e) => setDraft({ ...draft, inicio: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Entrega</Label>
                <Input
                  type="date"
                  value={draft.fim}
                  onChange={(e) => setDraft({ ...draft, fim: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quantidade</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.quantidade}
                  onChange={(e) => setDraft({ ...draft, quantidade: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number"
                  value={draft.valor}
                  onChange={(e) => setDraft({ ...draft, valor: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Observações</Label>
                <Textarea
                  value={draft.observacoes}
                  onChange={(e) => setDraft({ ...draft, observacoes: e.target.value })}
                  placeholder="Detalhes do pedido, condições de entrega, etc."
                />
              </div>
            </div>
            <DialogFooter>
              {isEdit && (
                <Button
                  variant="outline"
                  className="mr-auto text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    remove(draft.id);
                    setDraft(null);
                    toast.success("Contrato excluído");
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  exportContractPdf(draft);
                  toast.success("Contrato exportado para PDF");
                }}
              >
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
