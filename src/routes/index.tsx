import { createFileRoute } from "@tanstack/react-router";
import { Users, Trophy, TrendingUp, Receipt, AlertTriangle } from "lucide-react";
import { PageHeader, StatCard } from "@/components/Shell";
import {
  brl,
  fmtDate,
  seedClients,
  seedExpenses,
  seedStock,
  STAGES,
  useCollection,
  type Client,
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

function Dashboard() {
  const { items: clients } = useCollection<Client>("crm.clients", seedClients);
  const { items: stock } = useCollection<StockItem>("crm.stock", seedStock);
  const { items: expenses } = useCollection<Expense>("crm.expenses", seedExpenses);

  const ganhos = clients.filter((c) => c.stage === "ganho");
  const abertos = clients.filter((c) => c.stage === "novo" || c.stage === "proposta");
  const receita = ganhos.reduce((a, c) => a + c.valor, 0);
  const projecao = abertos.reduce((a, c) => a + c.valor, 0);
  const despesas = expenses.reduce((a, e) => a + e.valor, 0);
  const baixoEstoque = stock.filter((s) => s.quantidade <= s.minimo);

  const proximos = [...clients]
    .filter((c) => c.stage !== "perdido")
    .sort((a, b) => a.entrega.localeCompare(b.entrega))
    .slice(0, 5);

  const max = Math.max(1, ...STAGES.map((s) => clients.filter((c) => c.stage === s.id).length));

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da operação da fábrica"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes" value={String(clients.length)} hint={`${abertos.length} em aberto`} icon={Users} />
        <StatCard label="Ganhos" value={brl(receita)} hint={`${ganhos.length} pedidos fechados`} icon={Trophy} />
        <StatCard label="Projeção" value={brl(projecao)} hint="Pedidos no funil" icon={TrendingUp} />
        <StatCard label="Despesas" value={brl(despesas)} hint={`${expenses.length} lançamentos`} icon={Receipt} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold">Funil de vendas</h2>
          <div className="mt-4 space-y-3">
            {STAGES.map((s) => {
              const n = clients.filter((c) => c.stage === s.id).length;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">{s.label}</span>
                  <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(n / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-semibold">{n}</span>
                </div>
              );
            })}
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
