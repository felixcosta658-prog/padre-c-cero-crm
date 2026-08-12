import { useMemo, useState, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, FileDown, Pencil, Trash2, Table2, LayoutGrid, GripVertical, Loader2, Paperclip, Upload, X } from "lucide-react";

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
  logActivity,
  type Client,
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
  ganho: "bg-orange-500 text-white",
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
  pedido: newPedido(),
  nome: "",
  email: "",
  telefone: "",
  empresa: "",
  cidade: "",
  uf: "CE",
  valor: 0,
  entrega: today(),
  observacoes: "",
  stage: "novo",
  comprovanteNome: "",
  comprovante: "",
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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"alfabetica" | "recentes" | "entrega">("alfabetica");
  const [editing, setEditing] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Client | null>(null);
  const [draft, setDraft] = useState<ClientDraft>(emptyDraft());
  const [dragging, setDragging] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = clients.items.filter((c) => {
      if (!q) return true;
      return [c.nome, c.empresa, c.pedido, c.cidade, c.email].join(" ").toLowerCase().includes(q);
    });
    return [...list].sort((a, b) =>
      sort === "recentes"
        ? (b.createdAt || "").localeCompare(a.createdAt || "")
        : sort === "entrega"
          ? (a.entrega || "9999").localeCompare(b.entrega || "9999")
          : a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [clients.items, query, sort]);

  const totalCarteira = useMemo(
    () => clients.items.reduce((s, c) => s + c.valor, 0),
    [clients.items],
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
      clients.add(draft);
      toast.success("Cliente cadastrado");
      logActivity("cliente", `Cliente "${draft.nome}" cadastrado`);
    }
    setOpen(false);
  };

  const remove = (c: Client) => {
    setConfirmRemove(null);
    clients.remove(c.id);
    toast.success("Cliente excluído");
    logActivity("cliente", `Cliente "${c.nome}" excluído`);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const c = clients.items.find((x) => x.id === id);
    clients.update(id, { stage });
    toast.success(`Movido para "${stageLabel(stage)}"`);
    if (c) logActivity("cliente", `Pedido de "${c.nome}" movido para "${stageLabel(stage)}"`);
    setDragging(null);
  };

  const attachComprovante = async (c: Client, file: File | null) => {
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
    clients.update(c.id, { comprovante: dataUrl, comprovanteNome: file.name });
    clients.update(c.id, { stage: "perdido" });
    toast.success("Comprovante anexado e pedido movido para Recebido");
    logActivity("cliente", `Comprovante anexado ao pedido de "${c.nome}" (Recebido)`);
  };

  return (
    <>
      <PageHeader
        title="Clientes e Pedidos"
        subtitle={`${clients.items.length} registros · ${brl(totalCarteira)} em carteira`}
        action={
          <>
            <Button variant="outline" onClick={() => exportClientsPdf(filtered)}>
              <FileDown />
              PDF
            </Button>
            <Button onClick={openNew}>
              <Plus />
              Novo
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
            {filtered.map((c) => (
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
                </div>
                <div className="mt-3 flex flex-col gap-1.5 text-sm">
                  {c.telefone && <p className="text-muted-foreground">Tel: {c.telefone}</p>}
                  {c.email && (
                    <p className="break-all text-muted-foreground">E-mail: {c.email}</p>
                  )}
                  <p className="text-muted-foreground">
                    {c.cidade ? `${c.cidade}/${c.uf}` : c.uf || "—"}
                  </p>
                  {c.comprovante && (
                    <p className="flex items-center gap-1.5 text-success">
                      <Paperclip className="size-3.5" />
                      Comprovante anexado
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
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
            ))}
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
              const list = clients.items.filter((c) => c.stage === s.id);
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
                  {list.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(c.id);
                      }}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => openEdit(c)}
                      className={cn(
                        "rounded-xl border p-3 shadow-card cursor-grab transition-opacity active:cursor-grabbing",
                        cardTone[c.stage] || "bg-card",
                        dragging === c.id && "opacity-40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{c.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.empresa || "—"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmRemove(c);
                            }}
                            aria-label={`Excluir ${c.nome}`}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                          <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {c.observacoes || "Sem observações"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Badge className={stageTone[c.stage]}>{c.pedido}</Badge>
                        <span className="text-xs font-bold">{brl(c.valor)}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Entrega {fmtDate(c.entrega)}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {c.stage === "ganho" && (
                            <Loader2 className="size-3.5 animate-spin text-orange-500" />
                          )}
                          {c.comprovante ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(c.comprovante);
                              }}
                              className="flex items-center gap-1 text-[11px] text-success hover:underline"
                            >
                              <Paperclip className="size-3.5" />
                              <span className="max-w-[90px] truncate">
                                {c.comprovanteNome || "Comprovante"}
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
                                  attachComprovante(c, e.target.files?.[0] ?? null);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                        {c.comprovante && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clients.update(c.id, { comprovante: "", comprovanteNome: "" });
                              toast.success("Comprovante removido");
                            }}
                            className="text-[11px] text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
                ? `Atualizando o pedido ${editing.pedido}.`
                : "Cadastre um novo cliente e pedido."}
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
            <DialogTitle>Excluir cliente?</DialogTitle>
            <DialogDescription>
              {confirmRemove ? (
                <>
                  Tem certeza que deseja excluir <strong>{confirmRemove.nome}</strong> (pedido{" "}
                  {confirmRemove.pedido})? Esta ação não pode ser desfeita.
                </>
              ) : (
                "Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
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
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
