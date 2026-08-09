import {
  brl,
  fmtDate,
  STAGES,
  type Client,
  CONTRACT_STATUSES,
  normalizeContractStatus,
  type Contract,
} from "./crm-store";

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
    body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#14224a;padding:32px}
    h1{font-size:20px;margin:0}
    .sub{color:#5c6a8f;font-size:12px;margin:4px 0 20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{text-align:left;background:#16284d;color:#fff;padding:8px}
    td{padding:8px;border-bottom:1px solid #e3e8f0;vertical-align:top}
    .dim{color:#7c89a6}
    .r{text-align:right}
    tfoot td{font-weight:700;border-top:2px solid #16284d}
  </style></head><body>
  <h1>Fábrica de Cabos Padre Cícero</h1>
  <div class="sub">Relatório de pedidos — ${new Date().toLocaleString("pt-BR")}</div>
  <table>
    <thead><tr><th>Pedido</th><th>Cliente</th><th>Cidade</th><th>Etapa</th><th>Entrega</th><th class="r">Valor</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="5">Total (${clients.length} pedidos)</td><td class="r">${brl(total)}</td></tr></tfoot>
  </table>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
  </body></html>`);
  win.document.close();
}

export function exportContractPdf(c: Contract) {
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) return;
  const status =
    CONTRACT_STATUSES.find((s) => s.id === normalizeContractStatus(c.status))?.label ?? c.status;

  const emitido = new Date().toLocaleDateString("pt-BR");

  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
  <title>Pedido no ${c.numero} - Fabrica de cabos Padre Cicero</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#1b1f23;background:#fff;padding:32px;max-width:760px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:center;gap:24px;background:#16284d;color:#fff;border-radius:10px 10px 0 0;padding:20px 24px}
    .brand{display:flex;align-items:center;gap:12px}
    .brand .name{font-size:12px;font-weight:600;color:rgba(255,255,255,.75);margin:0}
    .brand .sub{color:#e8a87c;font-size:17px;font-weight:800;margin:0;line-height:1.2}
    .meta{text-align:right;font-size:13px}
    .meta .title{font-weight:700;font-size:15px;margin:0}
    .meta .dim{color:rgba(255,255,255,.7);margin:2px 0 0}
    .body{background:#fff;border:1px solid #dbe2f0;border-top:none;border-radius:0 0 10px 10px;padding:8px 24px 24px}
    .section{margin-top:20px}
    .section h2{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#16284d;border-bottom:2px solid #16284d33;padding-bottom:6px;margin:0 0 12px;font-weight:700}
    .grid{display:flex;flex-wrap:wrap;column-gap:40px}
    .row{display:flex;justify-content:space-between;gap:24px;padding:3px 0;font-size:13px;flex:1 1 45%}
    .row .k{color:#5b666f;min-width:150px}
    .row .v{font-weight:600;text-align:right}
    .obs{margin-top:10px;font-size:13px;white-space:pre-wrap;line-height:1.5}
    .sig{display:flex;gap:48px;margin-top:28px}
    .sig>div{flex:1}
    .sig .lbl{font-size:11px;color:#5b666f;margin-bottom:4px}
    .sig .name{font-size:13px;font-weight:600}
    .sig .line{border-bottom:2px solid #16284d;margin-top:28px}
    .footer{margin-top:28px;text-align:center;font-size:11px;font-weight:500;color:#fff;background:#16284d;border-radius:0 0 10px 10px;padding:10px 12px}
  </style></head><body>
  <div class="header">
    <div class="brand">
      <svg width="38" height="38" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22" r="20" stroke="#e8a87c" stroke-width="4.5" opacity="0.85" fill="none"/>
        <circle cx="22" cy="22" r="14.5" stroke="#e8a87c" stroke-width="3.5" opacity="0.55" fill="none"/>
        <circle cx="22" cy="22" r="9.5" stroke="#e8a87c" stroke-width="3" opacity="0.75" fill="none"/>
        <circle cx="22" cy="22" r="5" stroke="#e8a87c" stroke-width="2.5" opacity="0.5" fill="none"/>
        <circle cx="22" cy="22" r="1.8" fill="#fff"/>
      </svg>
      <div>
        <p class="name">Fábrica de cabos</p>
        <p class="sub">Padre Cícero</p>
      </div>
    </div>
    <div class="meta">
      <p class="title">Contrato de Fornecimento</p>
      <p class="dim">Emitido em ${emitido}</p>
      <p class="dim">Pedido no ${c.numero}</p>
    </div>
  </div>

  <div class="body">
    <div class="section">
      <h2>Dados do cliente</h2>
      <div class="grid">
        <div class="row"><span class="k">Razão Social / Nome</span><span class="v">${c.cliente}</span></div>
        <div class="row"><span class="k">E-mail</span><span class="v">—</span></div>
        <div class="row"><span class="k">Telefone</span><span class="v">—</span></div>
        <div class="row"><span class="k">CNPJ / CPF</span><span class="v">—</span></div>
        <div class="row"><span class="k">Endereço</span><span class="v">—</span></div>
      </div>
    </div>

    <div class="section">
      <h2>Detalhes do contrato</h2>
      <div class="grid">
        <div class="row"><span class="k">Data de Início</span><span class="v">${fmtDate(c.inicio)}</span></div>
        <div class="row"><span class="k">Data de Entrega</span><span class="v">${fmtDate(c.fim)}</span></div>
        <div class="row"><span class="k">Quantidade</span><span class="v">${c.quantidade || 0} un.</span></div>
        <div class="row"><span class="k">Valor Total</span><span class="v">${brl(c.valor || 0)}</span></div>
        <div class="row"><span class="k">Status</span><span class="v">${status}</span></div>
      </div>
      <p class="obs"><strong>Descrição | Anotações do Pedido</strong><br/>${c.observacoes || "—"}</p>
    </div>

    <div class="sig">
      <div>
        <p class="lbl">Assinatura do Fornecedor</p>
        <p class="name">Fábrica Padre Cicero</p>
        <div class="line"></div>
      </div>
      <div>
        <p class="lbl">Assinatura do Cliente</p>
        <p class="name">${c.cliente}</p>
        <div class="line"></div>
      </div>
    </div>
  </div>

  <div class="footer">Documento gerado automaticamente pelo sistema ERP - Fábrica Padre Cícero</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
  </body></html>`);
  win.document.close();
}
