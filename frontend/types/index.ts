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