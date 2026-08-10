import { useCallback, useEffect, useState } from "react";

export type Stage = "novo" | "proposta" | "ganho" | "perdido";

export const STAGES: { id: Stage; label: string }[] = [
  { id: "novo", label: "Novo cliente" },
  { id: "proposta", label: "Proposta Enviada" },
  { id: "ganho", label: "Ganho" },
  { id: "perdido", label: "Perdido" },
];

export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

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
};

export type Contract = {
  id: string;
  createdAt: string;
  numero: string;
  cliente: string;
  valor: number;
  inicio: string;
  fim: string;
  status: string;
};

export type Employee = {
  id: string;
  nome: string;
  funcao: string;
  telefone: string;
  admissao: string;
  meta: number;
  producao: number;
};

export type StockItem = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  minimo: number;
  fornecedor: string;
};

export type Expense = {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  pago: boolean;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return seed;
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
}

export function useCollection<T extends { id: string }>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read<T>(key, seed));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [key, items, ready]);

  const add = useCallback((item: Omit<T, "id"> & { id?: string }) => {
    setItems((prev) => [{ ...item, id: item.id ?? uid() } as T, ...prev]);
  }, []);

  const update = useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, setItems, add, update, remove, ready };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysFromNow = (n: number) => iso(new Date(Date.now() + n * 86400000));

export const seedClients: Client[] = [
  {
    id: "c1", createdAt: daysFromNow(-12), pedido: "PED-1001", nome: "João Batista",
    email: "joao@agrolar.com.br", telefone: "(88) 99811-2233", empresa: "Agro Lar Ferragens",
    cidade: "Juazeiro do Norte", uf: "CE", valor: 4800, entrega: daysFromNow(3),
    observacoes: "500 cabos de enxada, madeira tratada.", stage: "proposta",
  },
  {
    id: "c2", createdAt: daysFromNow(-30), pedido: "PED-1002", nome: "Maria Souza",
    email: "maria@construsertao.com", telefone: "(87) 99744-1100", empresa: "Constru Sertão",
    cidade: "Petrolina", uf: "PE", valor: 12750, entrega: daysFromNow(10),
    observacoes: "Cabos de marreta, entrega parcelada.", stage: "ganho",
  },
  {
    id: "c3", createdAt: daysFromNow(-4), pedido: "PED-1003", nome: "Antônio Ferreira",
    email: "antonio@ferragensbr.com", telefone: "(85) 98800-4455", empresa: "Ferragens BR",
    cidade: "Fortaleza", uf: "CE", valor: 3200, entrega: daysFromNow(15),
    observacoes: "Primeiro contato pela feira.", stage: "novo",
  },
  {
    id: "c4", createdAt: daysFromNow(-60), pedido: "PED-1004", nome: "Carla Mendes",
    email: "carla@lojaverde.com", telefone: "(83) 99666-7788", empresa: "Loja Verde",
    cidade: "Campina Grande", uf: "PB", valor: 2100, entrega: daysFromNow(-5),
    observacoes: "Preço acima do orçamento do cliente.", stage: "perdido",
  },
];

export const seedContracts: Contract[] = [
  { id: "k1", createdAt: daysFromNow(-30), numero: "CT-0021", cliente: "Constru Sertão", valor: 12750, inicio: daysFromNow(-30), fim: daysFromNow(60), status: "Ativo" },
  { id: "k2", createdAt: daysFromNow(-90), numero: "CT-0018", cliente: "Agro Lar Ferragens", valor: 8400, inicio: daysFromNow(-90), fim: daysFromNow(-10), status: "Encerrado" },
];

export const seedEmployees: Employee[] = [
  { id: "e1", nome: "Francisco Alves", funcao: "Torneiro", telefone: "(88) 99100-0011", admissao: daysFromNow(-800), meta: 400, producao: 372 },
  { id: "e2", nome: "Raimunda Lima", funcao: "Acabamento", telefone: "(88) 99100-0022", admissao: daysFromNow(-420), meta: 350, producao: 361 },
  { id: "e3", nome: "Pedro Henrique", funcao: "Envernizamento", telefone: "(88) 99100-0033", admissao: daysFromNow(-120), meta: 300, producao: 240 },
];

export const seedStock: StockItem[] = [
  { id: "s1", nome: "Verniz fosco", unidade: "L", quantidade: 48, minimo: 30, fornecedor: "Tintas Cariri" },
  { id: "s2", nome: "Sacos plásticos", unidade: "un", quantidade: 1200, minimo: 500, fornecedor: "Embalagens JN" },
  { id: "s3", nome: "Fita adesiva", unidade: "rolo", quantidade: 18, minimo: 25, fornecedor: "Embalagens JN" },
  { id: "s4", nome: "Lixas 120", unidade: "un", quantidade: 210, minimo: 100, fornecedor: "Ferragens BR" },
];

export const seedExpenses: Expense[] = [
  { id: "d1", data: daysFromNow(-5), descricao: "Compra de madeira bruta", categoria: "Matéria-prima", valor: 5400, pago: true },
  { id: "d2", data: daysFromNow(-2), descricao: "Energia elétrica", categoria: "Operacional", valor: 1280, pago: false },
  { id: "d3", data: daysFromNow(-1), descricao: "Manutenção do torno", categoria: "Manutenção", valor: 640, pago: true },
];

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
};
