# Padre Cícero CRM

PROMPT PARA CHATGPT

Crie um CRM simples e funcional para gestão e organização de um empresa que produz cabos em madeira com o nome - Fabrica de cabos Padre Cícero

O aplicativo deve ter duas formas principais de visualização dos dados:

Tabela de clientes — lista todos os clientes e pedidos em formato de tabela com colunas editáveis.

Visualização Kanban — organiza os pedidos e etapa de produção, permitindo arrastar e soltar entre colunas.

Campos (dados) dos clientes:

Data de Criação

Nome

E-mail

Telefone

Empresa

Observações

Cidade

UF (Se for selecionado Brasil, coloque todos estados)

Etapa do Funil (campo categórico)

Etapas do Funil (usadas na visualização Kanban):

Novo cliente

Proposta Enviada

Ganho

Perdido

CRUD completo (criar, visualizar, editar, excluir clientes)

Filtro e busca por nome, empresa, nº do pedido

Ordenação por data de criação e proximidade com a data de entrega

Opção de mudar a etapa do funil diretamente via drag-and-drop no Kanban

Possibilidade de adicionar notas rápidas (observações)

Visual limpo, moderno e predominantemente de Verde escuro (usar tons diferentes de verde para destaque)

Responsivo (desktop e mobile)

Design / Estilo:

Paleta principal: Cinza, e botões branco e laranja/cobre.

Tipografia limpa e moderna

Botões arredondados e ícones sutis

Interface clara, tipo dashboard

Layout intuitivo com tabs para alternar entre Tabela e Kanban

Extras (se possível):

Campo de busca global

Indicadores simples no topo (ex: total de clientes, ganhos, projeção)

Exportação de de pedidos em pdf

Resumo do objetivo:

Criar um CRM minimalista e eficiente para controle de pedidos e clientes, com duas formas de visualização (Tabela e Kanban), funil de vendas completo e visual majoritariamente azul-marinho.

Na lateral esquerda crie aba:

darshboard

Clientes

contratos

funcionarios, cadastro e controle de produção para funcionários.

Estoque, uma área para monitoramento de estoque como verniz, sacos, vita adesiva, lichas e botão de cadastro de novos materiais.

despesas

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64b3a8a8-b263-4b1c-a464-ab92d746b6e0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
