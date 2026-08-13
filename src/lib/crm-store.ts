import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Stage = "novo" | "proposta" | "ganho" | "perdido";

export const STAGES: { id: Stage; label: string }[] = [
  { id: "novo", label: "Novo cliente" },
  { id: "proposta", label: "Proposta Enviada" },
  { id: "ganho", label: "A receber" },
  { id: "perdido", label: "Recebido" },
];

export const stageLabel = (id: Stage) => STAGES.find((s) => s.id === id)?.label ?? id;

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type Client = {
  id: string;
  createdAt: string;
  pedido: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cidade: string;
  uf: string;
  valor: number;
  entrega: string;
  observacoes: string;
  stage: Stage;
  comprovanteNome?: string;
  comprovante?: string;
};

export type ContractStage = "pausado" | "producao" | "finalizado";

export const CONTRACT_STAGES: { id: ContractStage; label: string }[] = [
  { id: "pausado", label: "Pausado" },
  { id: "producao", label: "Em produção" },
  { id: "finalizado", label: "Finalizados" },
];

export type Contract = {
  id: string;
  createdAt: string;
  numero: string;
  cliente: string;
  valor: number;
  inicio: string;
  fim: string;
  status: string;
  etapa: ContractStage;
};

export type Employee = {
  id: string;
  nome: string;
  funcao: string;
  telefone: string;
  admissao: string;
  meta: number;
  producao: number;
  custo: number;
};

export type StockItem = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  minimo: number;
  fornecedor: string;
  fornecedorTelefone?: string;
  fornecedorEmail?: string;
  linkCompra?: string;
};

export type Expense = {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  pago: boolean;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const uid = () => Math.random().toString(36).slice(2, 10);

export function useActivity(): Activity[] {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const load = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem(ACTIVITY_KEY);
        setActivities(raw ? (JSON.parse(raw) as Activity[]) : []);
      } catch {
        setActivities([]);
      }
    };
    load();
    window.addEventListener("crm:activity", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("crm:activity", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return activities;
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return "—";
  return `${day}/${m}/${y}`;
};

export const iso = (d: Date) => d.toISOString().slice(0, 10);

export const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const today = () => iso(new Date());

export const newPedido = () => `PED-${Math.floor(1000 + Math.random() * 9000)}`;
export const newContrato = (existing: string[] = []) => {
  let max = 0;
  for (const n of existing) {
    const m = /^PD-(\d+)$/.exec(n.trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `PD-${String(max + 1).padStart(4, "0")}`;
};

export const diasRestantes = (entrega: string) => {
  if (!entrega) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${entrega}T00:00:00`);
  const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
  return Number.isNaN(diff) ? null : diff;
};

export const noMesAtual = (data: string) => {
  if (!data) return false;
  const hoje = new Date();
  const d = new Date(`${data}T00:00:00`);
  return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
};

export const nomeMes = () =>
  new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export type ActivityType =
  | "cliente"
  | "contrato"
  | "estoque"
  | "despesa"
  | "funcionario";

export type Activity = {
  id: string;
  data: string;
  hora: string;
  tipo: ActivityType;
  descricao: string;
};

const ACTIVITY_KEY = "crm.activity";

export function logActivity(tipo: ActivityType, descricao: string) {
  if (typeof window === "undefined") return;
  const now = new Date();
  const entry: Activity = {
    id: uid(),
    data: iso(now),
    hora: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    tipo,
    descricao,
  };
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    const list: Activity[] = raw ? JSON.parse(raw) : [];
    const next = [entry, ...list].slice(0, 100);
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
  } catch {
    // ignora falha de storage
  }
  window.dispatchEvent(new CustomEvent("crm:activity"));
}

/* ------------------------------------------------------------------ */
/* Seeds                                                               */
/* ------------------------------------------------------------------ */

export const seedClients: Client[] = [
  {
    id: "c1",
    createdAt: daysFromNow(-6),
    pedido: "PED-1001",
    nome: "João Batista",
    email: "joao.batista@agrolar.com.br",
    telefone: "(88) 99812-3445",
    empresa: "Agro Lar Ferragens",
    cidade: "Juazeiro do Norte",
    uf: "CE",
    valor: 4800,
    entrega: daysFromNow(3),
    observacoes: "500 cabos de enxada, madeira tratada.",
    stage: "proposta",
  },
  {
    id: "c2",
    createdAt: daysFromNow(-20),
    pedido: "PED-1002",
    nome: "Maria Souza",
    email: "maria.souza@construsertao.com.br",
    telefone: "(87) 99654-2211",
    empresa: "Constru Sertão",
    cidade: "Petrolina",
    uf: "PE",
    valor: 12750,
    entrega: daysFromNow(10),
    observacoes: "Cabos de marreta, entrega parcelada.",
    stage: "ganho",
  },
  {
    id: "c3",
    createdAt: daysFromNow(-2),
    pedido: "PED-1003",
    nome: "Antônio Ferreira",
    email: "antonio.ferreira@ferragensbr.com.br",
    telefone: "(85) 98123-7788",
    empresa: "Ferragens BR",
    cidade: "Fortaleza",
    uf: "CE",
    valor: 3200,
    entrega: daysFromNow(15),
    observacoes: "Primeiro contato pela feira.",
    stage: "novo",
  },
  {
    id: "c4",
    createdAt: daysFromNow(-12),
    pedido: "PED-1004",
    nome: "Carla Mendes",
    email: "carla.mendes@lojaverde.com.br",
    telefone: "(83) 98765-4321",
    empresa: "Loja Verde",
    cidade: "Campina Grande",
    uf: "PB",
    valor: 2100,
    entrega: daysFromNow(-5),
    observacoes: "Preço acima do orçamento do cliente.",
    stage: "perdido",
  },
];

export const seedContracts: Contract[] = [
  {
    id: "k1",
    createdAt: daysFromNow(-30),
    numero: "PD-0021",
    cliente: "Constru Sertão",
    valor: 12750,
    inicio: daysFromNow(-30),
    fim: daysFromNow(60),
    status: "Ativo",
    etapa: "producao",
  },
  {
    id: "k2",
    createdAt: daysFromNow(-90),
    numero: "PD-0018",
    cliente: "Agro Lar Ferragens",
    valor: 8400,
    inicio: daysFromNow(-90),
    fim: daysFromNow(-10),
    status: "Encerrado",
    etapa: "finalizado",
  },
];

export const seedEmployees: Employee[] = [
  {
    id: "e1",
    nome: "Francisco Alves",
    funcao: "Torneiro",
    telefone: "(88) 99911-2233",
    admissao: daysFromNow(-800),
    meta: 400,
    producao: 372,
    custo: 2,
  },
  {
    id: "e2",
    nome: "Raimunda Lima",
    funcao: "Acabamento",
    telefone: "(88) 99876-5544",
    admissao: daysFromNow(-420),
    meta: 350,
    producao: 361,
    custo: 1.5,
  },
  {
    id: "e3",
    nome: "Pedro Henrique",
    funcao: "Envernizamento",
    telefone: "(88) 99765-4433",
    admissao: daysFromNow(-120),
    meta: 300,
    producao: 240,
    custo: 1.2,
  },
];

export const seedStock: StockItem[] = [
  {
    id: "s1",
    nome: "Verniz fosco",
    unidade: "L",
    quantidade: 48,
    minimo: 30,
    fornecedor: "Tintas Cariri",
    fornecedorTelefone: "(88) 99000-1100",
    fornecedorEmail: "vendas@tintascariri.com.br",
    linkCompra: "https://www.mercadolivre.com.br",
  },
  {
    id: "s2",
    nome: "Sacos plásticos",
    unidade: "un",
    quantidade: 1200,
    minimo: 500,
    fornecedor: "Embalagens JN",
    fornecedorTelefone: "(88) 99100-2200",
    fornecedorEmail: "contato@embalagensjn.com.br",
  },
  {
    id: "s3",
    nome: "Fita adesiva",
    unidade: "rolo",
    quantidade: 18,
    minimo: 25,
    fornecedor: "Embalagens JN",
    fornecedorTelefone: "(88) 99100-2200",
    fornecedorEmail: "contato@embalagensjn.com.br",
  },
  {
    id: "s4",
    nome: "Lixas 120",
    unidade: "un",
    quantidade: 210,
    minimo: 100,
    fornecedor: "Ferragens BR",
    fornecedorTelefone: "(88) 99200-3300",
    fornecedorEmail: "pedidos@ferragensbr.com.br",
  },
];

export const seedExpenses: Expense[] = [
  {
    id: "d1",
    data: daysFromNow(-5),
    descricao: "Compra de madeira bruta",
    categoria: "Matéria-prima",
    valor: 5400,
    pago: true,
  },
  {
    id: "d2",
    data: daysFromNow(-2),
    descricao: "Energia elétrica",
    categoria: "Operacional",
    valor: 1280,
    pago: false,
  },
  {
    id: "d3",
    data: daysFromNow(-1),
    descricao: "Manutenção do torno",
    categoria: "Manutenção",
    valor: 640,
    pago: true,
  },
];

/* ------------------------------------------------------------------ */
/* Hook de persistência                                                */
/* ------------------------------------------------------------------ */

export type Collection<T extends { id: string }> = {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  add: (item: Omit<T, "id"> & { id?: string }) => string;
  update: (id: string, patch: Partial<T>) => void;
  remove: (id: string) => void;
  ready: boolean;
};

export function useCollection<T extends { id: string }>(key: string, seed: T[]): Collection<T> {
  const [items, setItems] = useState<T[]>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed as T[]);
      }
    } catch {
      // storage corrompido — mantém o seed
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [items, ready, key]);

  const api = useMemo<Omit<Collection<T>, "items" | "setItems" | "ready">>(() => {
    return {
      add: (item) => {
        const id = item.id ?? uid();
        setItems((prev) => [{ ...(item as T), id }, ...prev]);
        return id;
      },
      update: (id, patch) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
      },
      remove: (id) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
      },
    };
  }, []);

  return { items, setItems, ready, ...api };
}
