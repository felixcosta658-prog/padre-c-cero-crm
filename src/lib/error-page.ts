export function renderErrorPageHtml(stack: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Erro 500 | CRM | Fábrica de Cabos Padre Cícero</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f7f3ec; color: #18362b; display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; padding: 32px; max-width: 640px; }
    h1 { font-size: 72px; margin: 0; color: #b3740f; }
    h2 { font-size: 20px; margin: 8px 0; }
    p { color: #6b7a72; }
    pre { text-align: left; background: #ede8de; padding: 12px; border-radius: 12px; font-size: 11px; overflow: auto; max-height: 200px; color: #7c2d2d; }
  </style>
</head>
<body>
  <div class="box">
    <h1>500</h1>
    <h2>Erro interno do servidor</h2>
    <p>Algo deu errado ao processar sua requisição. Tente novamente em instantes.</p>
    ${stack ? `<pre>${stack.replace(/</g, "&lt;")}</pre>` : ""}
  </div>
</body>
</html>`;
}
