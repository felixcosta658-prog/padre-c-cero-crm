import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Users,
  Trophy,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  FileText,
  PackageSearch,
  Wallet,
  HardHat,
  type LucideIcon,
} from "lucide-react";

import { PageHeader, StatCard } from "@/components/Shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  useCollection,
  useActivity,
  brl,
  fmtDate,
  stageLabel,
  noMesAtual,
  nomeMes,
  diasRestantes,
  seedClients,
  seedKanban,
  seedContracts,
  seedStock,
  seedExpenses,
  CONTRACT_STAGES,
  type ActivityType,
  type Client,
  type KanbanCard,
} from "@/lib/crm-store";

const typeLabel: Record<ActivityType, string> = {
  cliente: "Clientes",
  contrato: "Contratos",
  estoque: "Estoque",
  despesa: "Despesas",
  funcionario: "Funcionários",
};

const typeIcon: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  cliente: { icon: UserPlus, className: "bg-accent/15 text-accent" },
  contrato: { icon: FileText, className: "bg-primary/15 text-primary" },
  estoque: { icon: PackageSearch, className: "bg-warning/15 text-warning" },
  despesa: { icon: Wallet, className: "bg-destructive/15 text-destructive" },
  funcionario: { icon: HardHat, className: "bg-secondary text-secondary-foreground" },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Fábrica de Cabos Padre Cícero" },
      {
        name: "description",
        content: "Visão geral da operação da Fábrica de Cabos Padre Cícero.",
      },
      {
        property: "og:title",
        content: "Dashboard | Fábrica de Cabos Padre Cícero",
      },
      {
        property: "og:description",
        content: "Visão geral da operação da fábrica de cabos em madeira.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const clients = useCollection<Client>("crm.clients", seedClients);
  const kanban = useCollection<KanbanCard>("crm.kanban", seedKanban);
  const stock = useCollection("crm.stock", seedStock);
  const expenses = useCollection("crm.expenses", seedExpenses);
  const contracts = useCollection("crm.contracts", seedContracts);
  const activities = useActivity();

  const clientById = useMemo(
    () => new Map(clients.items.map((c) => [c.id, c])),
    [clients.items],
  );

  const contratosPagos = contracts.items.filter((c) => c.pago);
  const contratosAReceber = contracts.items.filter((c) => !c.pago);

  const receita = contratosPagos.reduce((s, c) => s + c.valor, 0);
  const projecao = contratosAReceber.reduce((s, c) => s + c.valor, 0);
  const totalDespesas = expenses.items.reduce((s, e) => s + e.valor, 0);
  const baixoEstoque = stock.items.filter((s) => s.quantidade <= s.minimo);
  const ativos = contracts.items;

  const proximos = kanban.items
    .filter((k) => k.stage !== "perdido")
    .sort((a, b) => (a.entrega || "9999").localeCompare(b.entrega || "9999"))
    .slice(0, 5);

  const entradasMes = receita;
  const saidasMes = expenses.items
    .filter((e) => noMesAtual(e.data))
    .reduce((s, e) => s + e.valor, 0);
  const lucroLiquido = entradasMes - saidasMes;
  const mes = nomeMes();

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral da operação da fábrica" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contratos Ativos"
          value={ativos.length}
          hint={`${contracts.items.length} contratos cadastrados`}
          icon={Users}
        />
        <StatCard
          label="Recebidos"
          value={brl(receita)}
          hint={`${contratosPagos.length} contratos pagos`}
          icon={Trophy}
        />
        <StatCard
          label="Projeção"
          value={brl(projecao)}
          hint={`${contratosAReceber.length} contratos a receber`}
          icon={TrendingUp}
        />
        <StatCard
          label="Despesas"
          value={brl(totalDespesas)}
          hint={`${expenses.items.length} lançamentos`}
          icon={Receipt}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border bg-card shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Balanço do mês <span className="font-normal text-muted-foreground">— {mes}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 px-6">
            <div className="flex w-full max-w-sm items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ArrowUpRight className="text-success size-4" />
                Entradas
              </span>
              <span className="text-success text-lg font-bold">{brl(entradasMes)}</span>
            </div>
            <div className="flex w-full max-w-sm items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ArrowDownRight className="text-destructive size-4" />
                Saídas
              </span>
              <span className="text-destructive text-lg font-bold">{brl(saidasMes)}</span>
            </div>
            <div
              className={cn(
                "flex w-full max-w-sm items-center justify-between rounded-xl px-4 py-3",
                lucroLiquido >= 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              <span className="text-sm font-semibold">Lucro líquido</span>
              <span className="text-lg font-extrabold">{brl(lucroLiquido)}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`rounded-2xl border p-0 shadow-card ${
            baixoEstoque.length > 0
              ? "border-warning/40 bg-warning/15"
              : "border bg-card"
          }`}
        >
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <AlertTriangle
              className={baixoEstoque.length > 0 ? "text-warning" : "text-accent"}
            />
            <CardTitle className="text-base">Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-6">
            {baixoEstoque.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os materiais em nível seguro.</p>
            ) : (
              baixoEstoque.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{s.nome}</span>
                  <Badge className="bg-warning/20 text-warning">
                    {s.quantidade} {s.unidade}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-2xl border bg-card p-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Entregas mais próximas</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-2">
          <Table className="min-w-[640px]">
            <TableHeader className="bg-secondary/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Restam</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proximos.map((k) => {
                const restam = diasRestantes(k.entrega);
                const client = clientById.get(k.clientId);
                return (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.pedido}</TableCell>
                    <TableCell>{client?.nome ?? "—"}</TableCell>
                    <TableCell>{stageLabel(k.stage)}</TableCell>
                    <TableCell>{fmtDate(k.entrega)}</TableCell>
                    <TableCell>
                      {restam === null ? (
                        "—"
                      ) : restam < 0 ? (
                        <span className="font-bold text-destructive">Atrasado</span>
                      ) : restam === 0 ? (
                        <span className="font-bold text-accent">Hoje</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {restam} {restam === 1 ? "dia" : "dias"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">{brl(k.valor)}</TableCell>
                  </TableRow>
                );
              })}
              {proximos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma entrega pendente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4 rounded-2xl border bg-card p-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Contratos</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-2">
          <Table className="min-w-[640px]">
            <TableHeader className="bg-secondary/60">
              <TableRow className="hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.items.map((c) => {
                const etapaLabel =
                  CONTRACT_STAGES.find((s) => s.id === c.etapa)?.label ?? c.etapa;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.cliente}</TableCell>
                    <TableCell>{c.numero}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          c.status === "Ativo"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{etapaLabel}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          c.pago
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                        }
                      >
                        {c.pago ? "Pago" : "A receber"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">{brl(c.valor)}</TableCell>
                  </TableRow>
                );
              })}
              {contracts.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum contrato cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4 rounded-2xl border bg-card p-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Últimas movimentações</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-2">
          {activities.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Nenhuma movimentação registrada ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {activities.slice(0, 10).map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      typeIcon[a.tipo].className,
                    )}
                  >
                    {(() => {
                      const Icon = typeIcon[a.tipo].icon;
                      return <Icon className="size-4" />;
                    })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{a.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(a.data)} · {a.hora}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {typeLabel[a.tipo]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
