import { brl, fmtDate, STAGES, type Client } from "./crm-store";

export function exportClientsPdf(clients: Client[]) {
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) return;
  const rows = clients
    .map(
      (c) => `<tr>
        <td>${c.pedido}</td>
        <td>${c.nome}<br/><span class="dim">${c.empresa}</span></td>
        <td>${c.cidade}/${c.uf}</td>
        <td>${STAGES.find((s) => s.id === c.stage)?.label ?? ""}</td>
        <td>${fmtDate(c.entrega)}</td>
        <td class="r">${brl(c.valor)}</td>
      </tr>`,
    )
    .join("");
  const total = clients.reduce((a, c) => a + (c.valor || 0), 0);

  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
  <title>Pedidos - Fabrica de cabos Padre Cicero</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#14261c;padding:32px}
    h1{font-size:20px;margin:0}
    .sub{color:#6b7a72;font-size:12px;margin:4px 0 20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{text-align:left;background:#14342a;color:#fff;padding:8px}
    td{padding:8px;border-bottom:1px solid #e3e8e5;vertical-align:top}
    .dim{color:#8a978f}
    .r{text-align:right}
    tfoot td{font-weight:700;border-top:2px solid #14342a}
  </style></head><body>
  <h1>Fábrica de Cabos Padre Cícero</h1>
  <div class="sub">Relatório de pedidos — ${new Date().toLocaleString("pt-BR")}</div>
  <table>
    <thead><tr><th>Pedido</th><th>Cliente</th><th>Cidade</th><th>Etapa</th><th>Entrega</th><th class="r">Valor</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="5">Total (${clients.length} pedidos)</td><td class="r">${brl(total)}</td></tr></tfoot>
  </table>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>
  </body></html>`);
  win.document.close();
}
