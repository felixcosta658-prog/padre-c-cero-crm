import { useMemo, useState, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, FileDown, Pencil, Trash2, Table2, LayoutGrid, GripVertical, Loader2, Paperclip, Upload, X, ArrowLeftRight } from "lucide-react";

import { PageHeader } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useCollection,
  brl,
  fmtDate,
  today,
  newPedido,
  STAGES,
  UFS,
  stageLabel,
  seedClients,
  seedKanban,
  logActivity,
  type Client,
  type KanbanCard,
  type Stage,
} from "@/lib/crm-store";
import { exportClientsPdf } from "@/lib/pdf";
import { CIDADES_BRASIL } from "@/lib/cidades-brasil";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes e Pedidos | Padre Cícero" },
      {
        name: "description",
        content:
          "Cadastro de clientes e pedidos da Fábrica de Cabos Padre Cícero, com funil de vendas em kanban.",
      },
      {
        property: "og:title",
        content: "Clientes e Pedidos | Padre Cícero",
      },
      {
        property: "og:description",
        content: "Clientes e pedidos da fábrica de cabos em madeira, com funil de vendas.",
      },
    ],
  }),
  component: Clientes,
});

const stageTone: Record<Stage, string> = {
  novo: "bg-secondary text-secondary-foreground",
  proposta: "bg-accent/15 text-accent",
  ganho: "bg-warning text-white",
  perdido: "bg-success/15 text-success",
};

const cardTone: Record<Stage, string> = {
  novo: "",
  proposta: "",
  ganho: "",
  perdido: "bg-success/15 border-success/40",
};

type ClientDraft = Omit<Client, "id">;

const emptyDraft = (): ClientDraft => ({
  createdAt: today(),
  nome: "",
  email: "",
  telefone: "",
  empresa: "",
  cidade: "",
  uf: "CE",
  observacoes: "",
});

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`;
}

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

function Clientes() {
  const clients = useCollection<Client>("crm.clients", seedClients);
  const kanban = useCollection<KanbanCard>("crm.kanban", seedKanban);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"alfabetica" | "recentes" | "entrega">("alfabetica");
  const [editing, setEditing] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Client | null>(null);
  const [confirmRemoveCard, setConfirmRemoveCard] = useState<KanbanCard | null>(null);
  const [draft, setDraft] = useState<ClientDraft>(emptyDraft());
  const [dragging, setDragging] = useState<string | null>(null);

  const clientById = useMemo(
    () => new Map(clients.items.map((c) => [c.id, c])),
    [clients.items],
  );

  const cardByClientId = useMemo(
    () => new Map(kanban.items.map((k) => [k.clientId, k])),
    [kanban.items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = clients.items.filter((c) => {
      if (!q) return true;
      return [c.nome, c.empresa, c.cidade, c.email].join(" ").toLowerCase().includes(q);
    });
    return [...list].sort((a, b) =>
      sort === "recentes"
        ? (b.createdAt || "").localeCompare(a.createdAt || "")
        : sort === "entrega"
          ? (cardByClientId.get(a.id)?.entrega || "9999").localeCompare(
              cardByClientId.get(b.id)?.entrega || "9999",
            )
          : a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [clients.items, cardByClientId, query, sort]);

  const totalCarteira = useMemo(
    () => kanban.items.reduce((s, k) => s + k.valor, 0),
    [kanban.items],
  );

  const openNew = () => {
    setDraft(emptyDraft());
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    const { id: _id, ...rest } = c;
    setDraft(rest);
    setEditing(c);
    setOpen(true);
  };

  const set = (patch: Partial<ClientDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    if (!draft.nome.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    if (editing) {
      clients.update(editing.id, draft);
      toast.success("Cliente atualizado");
      logActivity("cliente", `Cliente "${draft.nome}" atualizado`);
    } else {
      const id = clients.add(draft);
      kanban.add({
        clientId: id,
        createdAt: today(),
        pedido: newPedido(),
        valor: 0,
        entrega: today(),
        stage: "novo",
      });
      toast.success("Cliente cadastrado");
      logActivity("cliente", `Cliente "${draft.nome}" cadastrado`);
    }
    setOpen(false);
  };

  const remove = (c: Client) => {
    setConfirmRemove(null);
    clients.remove(c.id);
    kanban.items.filter((k) => k.clientId === c.id).forEach((k) => kanban.remove(k.id));
    toast.success("Cliente excluído do cadastro");
    logActivity("cliente", `Cliente "${c.nome}" excluído do cadastro`);
  };

  const removeCard = (k: KanbanCard) => {
    setConfirmRemoveCard(null);
    kanban.remove(k.id);
    toast.success("Pedido removido do Kanban. Cliente mantido no cadastro.");
    logActivity("cliente", `Pedido "${k.pedido}" removido do Kanban`);
  };

  const addToKanban = (c: Client) => {
    if (cardByClientId.has(c.id)) {
      toast.info("Cliente já está no Kanban.");
      return;
    }
    kanban.add({
      clientId: c.id,
      createdAt: today(),
      pedido: newPedido(),
      valor: 0,
      entrega: today(),
      stage: "novo",
    });
    toast.success(`"${c.nome}" enviado ao Kanban`);
    logActivity("cliente", `Cliente "${c.nome}" enviado ao Kanban`);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const card = kanban.items.find((x) => x.id === id);
    if (!card) return;
    kanban.update(id, { stage });
    const client = clientById.get(card.clientId);
    toast.success(`Movido para "${stageLabel(stage)}"`);
    if (client) logActivity("cliente", `Pedido de "${client.nome}" movido para "${stageLabel(stage)}"`);
    setDragging(null);
  };

  const attachComprovante = async (k: KanbanCard, file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsDataURL(file);
    });
    kanban.update(k.id, { comprovante: dataUrl, comprovanteNome: file.name });
    kanban.update(k.id, { stage: "perdido" });
    toast.success("Comprovante anexado e pedido movido para Recebido");
    logActivity("cliente", `Comprovante anexado ao pedido de "${clientById.get(k.clientId)?.nome}" (Recebido)`);
  };

  return (
    <>
      <PageHeader
        title="Clientes e Pedidos"
        subtitle={`${clients.items.length} clientes cadastrados · ${brl(totalCarteira)} em carteira no Kanban`}
        action={
          <>
            <Button
              variant="outline"
              onClick={() =>
                exportClientsPdf(
                  filtered.map((c) => ({
                    pedido: cardByClientId.get(c.id)?.pedido ?? "—",
                    nome: c.nome,
                    cidade: c.cidade,
                    uf: c.uf,
                    stage: cardByClientId.get(c.id)?.stage ?? "novo",
                    entrega: cardByClientId.get(c.id)?.entrega ?? c.createdAt,
                    valor: cardByClientId.get(c.id)?.valor ?? 0,
                  })),
                )
              }
            >
              <FileDown />
              PDF
            </Button>
            <Button onClick={openNew}>
              <Plus />
              Novo cliente
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por nome, empresa, pedido, cidade ou e-mail..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <Tabs
          value={sort}
          onValueChange={(v) => setSort(v as "alfabetica" | "recentes" | "entrega")}
          className="w-fit"
        >
          <TabsList>
            <TabsTrigger value="alfabetica">A-Z</TabsTrigger>
            <TabsTrigger value="recentes">Mais recentes</TabsTrigger>
            <TabsTrigger value="entrega">Entrega próxima</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban">
            <LayoutGrid />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="tabela">
            <Table2 />
            Tabela
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => {
              const card = cardByClientId.get(c.id);
              return (
                <div
                  key={c.id}
                  className="shadow-card gap-4 rounded-2xl border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{c.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.empresa || "—"}
                      </p>
                    </div>
                    {card && (
                      <Badge className={stageTone[card.stage]}>{stageLabel(card.stage)}</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5 text-sm">
                    {c.telefone && <p className="text-muted-foreground">Tel: {c.telefone}</p>}
                    {c.email && (
                      <p className="break-all text-muted-foreground">E-mail: {c.email}</p>
                    )}
                    <p className="text-muted-foreground">
                      {c.cidade ? `${c.cidade}/${c.uf}` : c.uf || "—"}
                    </p>
                    {card?.comprovante && (
                      <p className="flex items-center gap-1.5 text-success">
                        <Paperclip className="size-3.5" />
                        Comprovante anexado
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-1 border-t pt-3">
                    <div>
                      {!card && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToKanban(c)}
                        >
                          <ArrowLeftRight />
                          Enviar ao Kanban
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        aria-label={`Editar ${c.nome}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmRemove(c)}
                        aria-label={`Excluir ${c.nome}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-muted-foreground">
                Nenhum cliente encontrado.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STAGES.map((s) => {
              const list = kanban.items.filter((k) => k.stage === s.id);
              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 rounded-2xl bg-secondary/40 p-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, s.id)}
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-semibold">{s.label}</span>
                    <Badge className="bg-card text-muted-foreground">{list.length}</Badge>
                  </div>
                  {list.map((k) => {
                    const client = clientById.get(k.clientId);
                    return (
                      <div
                        key={k.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", k.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragging(k.id);
                        }}
                        onDragEnd={() => setDragging(null)}
                        onClick={() => client && openEdit(client)}
                        className={cn(
                          "rounded-xl border p-3 shadow-card cursor-grab transition-opacity active:cursor-grabbing",
                          cardTone[k.stage] || "bg-card",
                          dragging === k.id && "opacity-40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{client?.nome || "—"}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {client?.empresa || "—"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmRemoveCard(k);
                              }}
                              aria-label={`Remover pedido ${k.pedido} do Kanban`}
                              title="Remover do Kanban (mantém o cliente no cadastro)"
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                            <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {client?.observacoes || "Sem observações"}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Badge className={stageTone[k.stage]}>{k.pedido}</Badge>
                          <span className="text-xs font-bold">{brl(k.valor)}</span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          Entrega {fmtDate(k.entrega)}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {k.stage === "ganho" && (
                              <Loader2 className="size-3.5 animate-spin text-warning" />
                            )}
                            {k.comprovante ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(k.comprovante);
                                }}
                                className="flex items-center gap-1 text-[11px] text-success hover:underline"
                              >
                                <Paperclip className="size-3.5" />
                                <span className="max-w-[90px] truncate">
                                  {k.comprovanteNome || "Comprovante"}
                                </span>
                              </button>
                            ) : (
                              <label className="flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-accent">
                                <Upload className="size-3.5" />
                                Anexar
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    attachComprovante(k, e.target.files?.[0] ?? null);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          {k.comprovante && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                kanban.update(k.id, { comprovante: "", comprovanteNome: "" });
                                toast.success("Comprovante removido");
                              }}
                              className="text-[11px] text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {list.length === 0 && (
                    <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Arraste pedidos para cá
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${editing.nome}` : "Novo cliente"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Atualizando o cadastro de ${editing.nome}.`
                : "Cadastre um novo cliente na base de clientes."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-140px)] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <Input
                  value={draft.nome}
                  onChange={(e) => set({ nome: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </Field>
              <Field label="Empresa">
                <Input
                  value={draft.empresa}
                  onChange={(e) => set({ empresa: e.target.value })}
                  placeholder="Razão social ou loja"
                />
              </Field>
              <Field label="E-mail">
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="cliente@exemplo.com"
                />
              </Field>
              <Field label="Telefone">
                <Input
                  value={draft.telefone}
                  onChange={(e) => set({ telefone: maskPhone(e.target.value) })}
                  placeholder="(88) 99601-0507"
                />
              </Field>
              <Field label="Cidade">
                <Select
                  value={draft.cidade}
                  onValueChange={(v) => set({ cidade: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {(CIDADES_BRASIL[draft.uf] ?? []).map((cidade) => (
                      <SelectItem key={cidade} value={cidade}>
                        {cidade}
                      </SelectItem>
                    ))}
                    {!CIDADES_BRASIL[draft.uf]?.length && (
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        Nenhuma cidade encontrada.
                      </p>
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="UF">
                <Select
                  value={draft.uf}
                  onValueChange={(v) => set({ uf: v, cidade: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {UFS.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Observações" className="sm:col-span-2">
                <Textarea
                  value={draft.observacoes}
                  onChange={(e) => set({ observacoes: e.target.value })}
                  placeholder="Anotações sobre o pedido..."
                  rows={3}
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmRemove !== null}
        onOpenChange={(v) => !v && setConfirmRemove(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir cliente do cadastro?</DialogTitle>
            <DialogDescription>
              {confirmRemove ? (
                <>
                  Tem certeza que deseja excluir <strong>{confirmRemove.nome}</strong> do
                  cadastro de clientes? Esta ação não pode ser desfeita.
                </>
              ) : (
                "Tem certeza que deseja excluir este cliente do cadastro? Esta ação não pode ser desfeita."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRemove && remove(confirmRemove)}
            >
              <Trash2 />
              Excluir do cadastro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmRemoveCard !== null}
        onOpenChange={(v) => !v && setConfirmRemoveCard(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover do Kanban?</DialogTitle>
            <DialogDescription>
              {confirmRemoveCard ? (
                <>
                  O pedido <strong>{confirmRemoveCard.pedido}</strong> será removido do Kanban.
                  O cliente{" "}
                  <strong>{clientById.get(confirmRemoveCard.clientId)?.nome ?? "—"}</strong>{" "}
                  permanece no cadastro de clientes.
                </>
              ) : (
                "Remover o pedido do Kanban? O cliente permanece no cadastro."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemoveCard(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRemoveCard && removeCard(confirmRemoveCard)}
            >
              <Trash2 />
              Remover do Kanban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
