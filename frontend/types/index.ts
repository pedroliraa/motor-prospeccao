export interface Empresa {
  id: number;
  cnpj: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cnae: string | null;
  cnaeDescricao: string | null;
  cidade: string | null;
  estado: string | null;
  faturamentoEstimado: string | null;
  qtdeFuncionarios: string | null;
  dataAbertura: string | null;
  telefone1: string | null;
  email: string | null;
  porte: string | null;
  regimeTributario: string | null;
  capitalSocial: number | null;
  socios: string | null;
  googleNota: number | null;
  googleAvaliacoes: number | null;
  whatsapp: string | null;
  notas: string | null;
  instagramHandle: string | null;
  instagramSeguidores: number | null;
  score: number | null;
  classificacao: string | null;
  justificativa: string | null;
  status: string;
}

export interface Execucao {
  id: number;
  segmento: string;
  status: string;
  totalEmpresas: number;
  createdAt: string;
}

export interface FiltrosBusca {
  segmento: string;
  cnaes: string[];
  estados: string[];
  municipios: string[];
  porte: string[];
  regime: string[];
}

export interface Busca {
  id: number;
  segmento: string;
  filtros: string;
  totalLeads: number;
  createdAt: string;
}

export interface Etiqueta {
  id: number;
  nome: string;
  cor: string;
}

export interface DashboardData {
  total: number;
  porCidade: { cidade: string; total: number }[];
  porCnae: { cnae: string; total: number }[];
  porPorte: { porte: string; total: number }[];
  porRegime: { regime: string; total: number }[];
  classificacao: {
    quentes: number;
    mornos: number;
    frios: number;
    semClassificacao: number;
  };
  qualidade: {
    comTelefone: number;
    comWhatsapp: number;
    comGoogle: number;
  };
  evolucaoBuscas: { createdAt: string; totalLeads: number; segmento: string }[];
}