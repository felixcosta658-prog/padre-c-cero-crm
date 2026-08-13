import { useState, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Table2, LayoutGrid } from "lucide-react";

import { PageHeader } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  newContrato,
  seedContracts,
  CONTRACT_STAGES,
  logActivity,
  type Contract,
  type ContractStage,
} from "@/lib/crm-store";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos | Padre Cícero" },
      {
        name: "description",
        content: "Contratos de fornecimento da Fábrica de Cabos Padre Cícero.",
      },
      {
        property: "og:title",
        content: "Contratos | Padre Cícero",
      },
      {
        property: "og:description",
        content: "Contratos de fornecimento da fábrica de cabos em madeira.",
      },
    ],
  }),
  component: Contratos,
});

type ContractDraft = Omit<Contract, "id">;

const emptyDraft = (): ContractDraft => ({
  createdAt: today(),
  numero: newContrato(),
  cliente: "",
  valor: 0,
  inicio: today(),
  fim: today(),
  status: "Ativo",
  etapa: "producao",
});

const etapaTone: Record<ContractStage, string> = {
  pausado: "bg-secondary text-secondary-foreground",
  producao: "bg-warning/15 text-warning",
  finalizado: "bg-success/15 text-success",
};

const cardTone: Record<ContractStage, string> = {
  pausado: "bg-card",
  producao: "bg-warning/15 border-warning/40",
  finalizado: "bg-success/15 border-success/40",
};

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

function Contratos() {
  const contracts = useCollection<Contract>("crm.contracts", seedContracts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Contract | null>(null);
  const [draft, setDraft] = useState<ContractDraft>(emptyDraft());
  const [dragging, setDragging] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const set = (patch: Partial<ContractDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const total = contracts.items.reduce((s, c) => s + c.valor, 0);

  const filtered = contracts.items.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.numero.toLowerCase().includes(q) || c.cliente.toLowerCase().includes(q);
  });

  const openNew = () => {
    setEditing(null);
    setDraft({ ...emptyDraft(), numero: newContrato(contracts.items.map((c) => c.numero)) });
    setOpen(true);
  };

  const openEdit = (c: Contract) => {
    const { id: _id, ...rest } = c;
    setDraft(rest);
    setEditing(c);
    setOpen(true);
  };

  const save = () => {
    if (!draft.cliente.trim()) {
      toast.error("Informe o cliente.");
      return;
    }
    const numero = draft.numero.trim() || newContrato(contracts.items.map((c) => c.numero));
    const item = { ...draft, numero };
    if (editing) {
      contracts.update(editing.id, item);
      toast.success(`Contrato ${numero} atualizado`);
      logActivity("contrato", `Contrato ${numero} atualizado`);
    } else {
      contracts.add(item);
      toast.success(`Contrato ${numero} cadastrado`);
      logActivity("contrato", `Contrato ${numero} cadastrado`);
    }
    setOpen(false);
  };

  const toggleStatus = (c: Contract) => {
    const next = c.status === "Ativo" ? "Encerrado" : "Ativo";
    contracts.update(c.id, { status: next });
    toast.success(`Contrato marcado como ${next.toLowerCase()}.`);
    logActivity("contrato", `Contrato ${c.numero} marcado como ${next.toLowerCase()}`);
  };

  const remove = (c: Contract) => {
    setConfirmRemove(null);
    contracts.remove(c.id);
    toast.success("Contrato excluído");
    logActivity("contrato", `Contrato ${c.numero} excluído`);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, etapa: ContractStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    contracts.update(id, { etapa });
    const label = CONTRACT_STAGES.find((s) => s.id === etapa)?.label ?? etapa;
    toast.success(`Movido para "${label}"`);
    logActivity("contrato", `Contrato movido para "${label}"`);
    setDragging(null);
  };

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle={`${contracts.items.length} contratos · ${brl(total)}`}
        action={
          <Button onClick={openNew}>
            <Plus />
            Novo contrato
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Buscar por número (PD-XXXX) ou nome do cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
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
          <Card className="rounded-2xl border bg-card p-0 shadow-card">
            <div className="p-3">
              <Table className="min-w-[720px]">
                <TableHeader className="bg-secondary/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} onClick={() => openEdit(c)} className="cursor-pointer">
                      <TableCell className="font-medium">{c.cliente}</TableCell>
                      <TableCell>{c.numero}</TableCell>
                      <TableCell>{fmtDate(c.inicio)}</TableCell>
                      <TableCell>{fmtDate(c.fim)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleStatus(c)}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                            c.status === "Ativo"
                              ? "bg-primary text-primary-foreground hover:bg-primary/85"
                              : "bg-muted text-muted-foreground hover:bg-muted/70",
                          )}
                        >
                          {c.status}
                        </button>
                      </TableCell>
                      <TableCell className="text-right font-bold">{brl(c.valor)}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nenhum contrato encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid gap-4 md:grid-cols-3">
            {CONTRACT_STAGES.map((s) => {
              const list = filtered.filter((c) => (c.etapa ?? "producao") === s.id);
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
                        "rounded-xl border p-3 shadow-card cursor-pointer transition-opacity hover:border-primary/50",
                        cardTone[c.etapa ?? "producao"],
                        dragging === c.id && "opacity-40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{c.cliente}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.numero}</p>
                        </div>
                        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Badge className={etapaTone[c.etapa ?? "producao"]}>
                          {CONTRACT_STAGES.find((x) => x.id === (c.etapa ?? "producao"))?.label ??
                            c.etapa}
                        </Badge>
                        <span className="text-xs font-bold">{brl(c.valor)}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {fmtDate(c.inicio)} → {fmtDate(c.fim)}
                      </p>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Arraste contratos para cá
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar contrato ${editing.numero}` : "Novo contrato"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Atualize os dados do contrato de ${editing.cliente}.`
                : "Registre um novo contrato de fornecimento."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cliente">
              <Input
                value={draft.cliente}
                onChange={(e) => set({ cliente: e.target.value })}
                placeholder="Nome do cliente"
              />
            </Field>
            <Field label="Número">
              <Input value={draft.numero} onChange={(e) => set({ numero: e.target.value })} />
            </Field>
            <Field label="Início">
              <Input
                type="date"
                value={draft.inicio}
                onChange={(e) => set({ inicio: e.target.value })}
              />
            </Field>
            <Field label="Fim">
              <Input type="date" value={draft.fim} onChange={(e) => set({ fim: e.target.value })} />
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
            <Field label="Etapa" className="sm:col-span-2">
              <Select
                value={draft.etapa}
                onValueChange={(v) => set({ etapa: v as ContractStage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <DialogFooter>
            {editing && (
              <Button
                variant="outline"
                className="mr-auto text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmRemove(editing)}
              >
                <Trash2 />
                Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>{editing ? "Salvar alterações" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmRemove !== null}
        onOpenChange={(v) => !v && setConfirmRemove(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir contrato?</DialogTitle>
            <DialogDescription>
              {confirmRemove ? (
                <>
                  Tem certeza que deseja excluir o contrato{" "}
                  <strong>
                    {confirmRemove.numero} ({confirmRemove.cliente})
                  </strong>
                  ? Esta ação não pode ser desfeita.
                </>
              ) : (
                "Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
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
