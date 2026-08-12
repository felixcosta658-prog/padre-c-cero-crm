# Rotas

Rotas do CRM interno da Fábrica de Cabos Padre Cícero (TanStack Router, file-based):

- `index.tsx` — Dashboard: indicadores, balanço do mês, estoque baixo e entregas próximas.
- `clientes.tsx` — Clientes e pedidos: tabela + kanban (funil), busca, PDF e cadastro.
- `contratos.tsx` — Contratos de fornecimento.
- `funcionarios.tsx` — Funcionários e produção mensal.
- `estoque.tsx` — Materiais de produção e acabamento.
- `despesas.tsx` — Custos operacionais.

Dados persistidos no `localStorage` (chaves `crm.*`), com seeds de exemplo como fallback.
