import { createFileRoute } from "@tanstack/react-router";
import { Users, Trophy, TrendingUp, Receipt, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PageHeader, StatCard } from "@/components/Shell";
import {
  brl,
  fmtDate,
  seedClients,
  seedContracts,
  seedExpenses,
  seedStock,
  STAGES,
  useCollection,
  type Client,
  type Contract,
  type Expense,
  type StockItem,
} from "@/lib/crm-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Fábrica de Cabos Padre Cícero" },
      {
        name: "description",
        content:
          "Painel de controle da Fábrica de Cabos Padre Cícero: pedidos, funil de vendas, produção, estoque e despesas.",
      },
      { property: "og:title", content: "Dashboard | Fábrica de Cabos Padre Cícero" },
      {
        property: "og:description",
        content: "Acompanhe clientes, pedidos, produção e estoque da fábrica em um só painel.",
      },
    ],
  }),
  component: Dashboard,
});

const diasRestantes = (data: string): number => {
  if (!data) return 0;
  const [y = 0, m = 0, d = 0] = data.slice(0, 10).split("-").map(Number);
  const alvo = new Date(y, m - 1, d);
  return Math.round((alvo.getTime() - Date.now()) / 86400000);
};

function Dashboard() {
  const { items: clients } = useCollection<Client>("crm.clients", seedClients);
  const { items: stock } = useCollection<StockItem>("crm.stock", seedStock);
  const { items: expenses } = useCollection<Expense>("crm.expenses", seedExpenses);
  const { items: contracts } = useCollection<Contract>("crm.contracts", seedContracts);

  const ganhos = clients.filter((c) => c.stage === "ganho");
  const abertos = clients.filter((c) => c.stage === "novo" || c.stage === "proposta");
  const receita = ganhos.reduce((a, c) => a + c.valor, 0);
  const projecao = abertos.reduce((a, c) => a + c.valor, 0);
  const despesas = expenses.reduce((a, e) => a + e.valor, 0);
  const baixoEstoque = stock.filter((s) => s.quantidade <= s.minimo);
  const contratosAtivos = contracts.filter((k) => k.status !== "Encerrado");

  const proximos = [...clients]
    .filter((c) => c.stage !== "perdido")
    .sort((a, b) => a.entrega.localeCompare(b.entrega))
    .slice(0, 5);

  const noMesAtual = (data: string) => {
    const agora = new Date();
    const [y, m] = data.slice(0, 10).split("-");
    return Number(y) === agora.getFullYear() && Number(m) === agora.getMonth() + 1;
  };
  const entradasMes = ganhos.filter((c) => noMesAtual(c.createdAt)).reduce((a, c) => a + c.valor, 0);
  const saidasMes = expenses.filter((e) => noMesAtual(e.data)).reduce((a, e) => a + e.valor, 0);
  const lucroLiquido = entradasMes - saidasMes;
  const nomeMes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da operação da fábrica"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contratos Ativos" value={String(contratosAtivos.length)} hint={`${contracts.length} contratos no total`} icon={Users} />
        <StatCard label="Recebidos" value={brl(receita)} hint={`${ganhos.length} pedidos fechados`} icon={Trophy} />
        <StatCard label="Projeção" value={brl(projecao)} hint="Pedidos no funil" icon={TrendingUp} />
        <StatCard label="Despesas" value={brl(despesas)} hint={`${expenses.length} lançamentos`} icon={Receipt} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold">Balanço do mês</h2>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">{nomeMes}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpRight className="h-4 w-4 text-success" /> Entradas
              </span>
              <span className="text-sm font-semibold text-success">{brl(entradasMes)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowDownRight className="h-4 w-4 text-destructive" /> Saídas
              </span>
              <span className="text-sm font-semibold text-destructive">{brl(saidasMes)}</span>
            </div>
            <div
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                lucroLiquido >= 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              <span className="text-sm font-semibold">Lucro líquido</span>
              <span className="text-base font-bold">{brl(lucroLiquido)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-accent" /> Estoque baixo
          </h2>
          {baixoEstoque.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Todos os materiais em nível seguro.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {baixoEstoque.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{s.nome}</span>
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                    {s.quantidade} {s.unidade}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold">Entregas mais próximas</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2">Pedido</th>
                <th className="pb-2">Cliente</th>
                <th className="pb-2">Etapa</th>
                <th className="pb-2">Entrega</th>
                <th className="pb-2">Restam</th>
                <th className="pb-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {proximos.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="py-2.5 font-medium">{c.pedido}</td>
                  <td className="py-2.5">{c.nome}</td>
                  <td className="py-2.5 text-muted-foreground">
                    {STAGES.find((s) => s.id === c.stage)?.label}
                  </td>
                  <td className="py-2.5">{fmtDate(c.entrega)}</td>
                  <td className="py-2.5">
                    {diasRestantes(c.entrega) < 0 ? (
                      <span className="font-semibold text-destructive">Atrasado</span>
                    ) : diasRestantes(c.entrega) === 0 ? (
                      <span className="font-semibold text-accent">Hoje</span>
                    ) : (
                      <span>{diasRestantes(c.entrega)} dias</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-semibold">{brl(c.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
