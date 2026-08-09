import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, FileDown, Pencil, Trash2, LayoutGrid, Table2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  brl,
  fmtDate,
  seedClients,
  STAGES,
  UFS,
  uid,
  useCollection,
  type Client,
  type Stage,
} from "@/lib/crm-store";
import { exportClientsPdf } from "@/lib/pdf";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes e Pedidos | Padre Cícero" },
      {
        name: "description",
        content:
          "Cadastro de clientes e pedidos com tabela editável e funil kanban com arrastar e soltar.",
      },
      { property: "og:title", content: "Clientes e Pedidos | Padre Cícero" },
      {
        property: "og:description",
        content: "Gerencie clientes, pedidos e o funil de vendas da fábrica de cabos.",
      },
    ],
  }),
  component: ClientesPage,
});

const empty = (): Client => ({
  id: uid(),
  createdAt: new Date().toISOString().slice(0, 10),
  pedido: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
  nome: "",
  email: "",
  telefone: "",
  empresa: "",
  cidade: "",
  uf: "CE",
  valor: 0,
  entrega: new Date().toISOString().slice(0, 10),
  observacoes: "",
  stage: "novo",
});

const stageTone: Record<Stage, string> = {
  novo: "bg-secondary text-secondary-foreground",
  proposta: "bg-accent/15 text-accent",
  ganho: "bg-primary text-primary-foreground",
  perdido: "bg-muted text-muted-foreground",
};

function ClientesPage() {
  const { items, add, update, remove } = useCollection<Client>("crm.clients", seedClients);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recentes" | "entrega">("recentes");
  const [editing, setEditing] = useState<Client | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((c) =>
      !q
        ? true
        : [c.nome, c.empresa, c.pedido, c.cidade, c.email].some((f) =>
            (f ?? "").toLowerCase().includes(q),
          ),
    );
    return list.sort((a, b) =>
      sort === "recentes"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.entrega.localeCompare(b.entrega),
    );
  }, [items, query, sort]);

  const save = (client: Client) => {
    if (!client.nome.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    if (items.some((i) => i.id === client.id)) {
      update(client.id, client);
      toast.success("Cliente atualizado");
    } else {
      add(client);
      toast.success("Cliente cadastrado");
    }
    setEditing(null);
  };

  const onDrop = (stage: Stage) => {
    if (!dragging) return;
    update(dragging, { stage } as Partial<Client>);
    setDragging(null);
    toast.success(`Movido para "${STAGES.find((s) => s.id === stage)?.label}"`);
  };

  return (
    <>
      <PageHeader
        title="Clientes e Pedidos"
        subtitle={`${items.length} registros · ${brl(items.reduce((a, c) => a + c.valor, 0))} em carteira`}
        action={
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => exportClientsPdf(filtered)}>
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => setEditing(empty())}>
              <Plus className="h-4 w-4" /> Novo
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="tabela">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="rounded-xl">
            <TabsTrigger value="tabela" className="rounded-lg">
              <Table2 className="h-4 w-4" /> Tabela
            </TabsTrigger>
            <TabsTrigger value="kanban" className="rounded-lg">
              <LayoutGrid className="h-4 w-4" /> Kanban
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nome, empresa ou pedido"
                className="rounded-xl pl-9"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-[150px] shrink-0 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="entrega">Entrega próxima</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="tabela">
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Criação</th>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Cidade/UF</th>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3">Entrega</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-border align-top hover:bg-secondary/40">
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{c.pedido}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.empresa}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{c.telefone}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {c.cidade}/{c.uf}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={c.stage}
                        onValueChange={(v) => update(c.id, { stage: v as Stage })}
                      >
                        <SelectTrigger className="h-8 w-[160px] rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">{fmtDate(c.entrega)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{brl(c.valor)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            remove(c.id);
                            toast.success("Cliente excluído");
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STAGES.map((s) => {
              const cards = filtered.filter((c) => c.stage === s.id);
              return (
                <div
                  key={s.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(s.id)}
                  className="flex min-h-[220px] flex-col rounded-2xl border border-border bg-secondary/40 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-2 px-1">
                    <span className="truncate text-sm font-semibold">{s.label}</span>
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
                        onClick={() => setEditing(c)}
                        className="cursor-grab rounded-xl border border-border bg-card p-3 shadow-card active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{c.nome}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.empresa}</p>
                          </div>
                          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {c.observacoes || "Sem observações"}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${stageTone[c.stage]}`}>
                            {c.pedido}
                          </span>
                          <span className="text-xs font-semibold">{brl(c.valor)}</span>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Entrega {fmtDate(c.entrega)}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <ClientDialog client={editing} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}

function ClientDialog({
  client,
  onClose,
  onSave,
}: {
  client: Client | null;
  onClose: () => void;
  onSave: (c: Client) => void;
}) {
  const [draft, setDraft] = useState<Client | null>(client);
  const current = draft && client && draft.id === client.id ? draft : client;

  if (!client || !current) return null;
  const set = (patch: Partial<Client>) => setDraft({ ...current, ...patch });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client.nome ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <Input value={current.nome} onChange={(e) => set({ nome: e.target.value })} />
          </Field>
          <Field label="Empresa">
            <Input value={current.empresa} onChange={(e) => set({ empresa: e.target.value })} />
          </Field>
          <Field label="E-mail">
            <Input value={current.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Telefone">
            <Input value={current.telefone} onChange={(e) => set({ telefone: e.target.value })} />
          </Field>
          <Field label="Nº do pedido">
            <Input value={current.pedido} onChange={(e) => set({ pedido: e.target.value })} />
          </Field>
          <Field label="Valor (R$)">
            <Input
              type="number"
              value={current.valor}
              onChange={(e) => set({ valor: Number(e.target.value) })}
            />
          </Field>
          <Field label="Cidade">
            <Input value={current.cidade} onChange={(e) => set({ cidade: e.target.value })} />
          </Field>
          <Field label="UF">
            <Select value={current.uf} onValueChange={(v) => set({ uf: v })}>
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
          <Field label="Data de criação">
            <Input
              type="date"
              value={current.createdAt}
              onChange={(e) => set({ createdAt: e.target.value })}
            />
          </Field>
          <Field label="Data de entrega">
            <Input
              type="date"
              value={current.entrega}
              onChange={(e) => set({ entrega: e.target.value })}
            />
          </Field>
          <Field label="Etapa do funil">
            <Select value={current.stage} onValueChange={(v) => set({ stage: v as Stage })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Observações">
              <Textarea
                rows={3}
                value={current.observacoes}
                onChange={(e) => set({ observacoes: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(current)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
