import { brl, fmtDate, stageLabel, type Stage } from "./crm-store";

export type ClientPdfRow = {
  pedido: string;
  nome: string;
  cidade: string;
  uf: string;
  stage: Stage;
  entrega: string;
  valor: number;
};

export function exportClientsPdf(rows: ClientPdfRow[]) {
  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) return;

  const dataHora = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const total = rows.reduce((s, c) => s + c.valor, 0);

  const body = rows
    .map(
      (c) => `
      <tr>
        <td>${c.pedido}</td>
        <td>${c.nome}</td>
        <td>${c.cidade}/${c.uf}</td>
        <td>${stageLabel(c.stage)}</td>
        <td>${fmtDate(c.entrega)}</td>
        <td class="num">${brl(c.valor)}</td>
      </tr>`,
    )
    .join("");

  w.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório de pedidos</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #14342a; }
    header { background: #14342a; color: #fff; padding: 24px 32px; }
    header h1 { margin: 0 0 4px; font-size: 20px; }
    header p { margin: 0; font-size: 12px; opacity: .8; }
    main { padding: 24px 32px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; background: #eef3f0; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #44604f; }
    td { padding: 8px 10px; border-bottom: 1px solid #e3eae6; }
    td.num, th.num { text-align: right; }
    .total { text-align: right; margin-top: 16px; font-size: 15px; font-weight: 700; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <header>
    <h1>Fábrica de Cabos Padre Cícero</h1>
    <p>Relatório de pedidos — ${dataHora}</p>
  </header>
  <main>
    <table>
      <thead>
        <tr>
          <th>Pedido</th><th>Cliente</th><th>Cidade</th><th>Etapa</th><th>Entrega</th><th class="num">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${body}
      </tbody>
    </table>
    <p class="total">Total: ${brl(total)}</p>
  </main>
  <script>setTimeout(function(){ window.print(); }, 300);</script>
</body>
</html>
  `);

  w.document.close();
}
