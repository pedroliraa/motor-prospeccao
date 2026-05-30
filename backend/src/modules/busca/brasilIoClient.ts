import axios from 'axios';
import { env } from '../../config/loadConfig.js';

const BASE = 'https://brasil.io/api/dataset/socios-brasil/empresas/data/';

export interface EmpresaBrasilIo {
  cnpj:               string;
  razao_social:       string;
  nome_fantasia:      string | null;
  cnae_fiscal:        string;
  logradouro:         string | null;
  municipio:          string | null;
  uf:                 string | null;
  telefone1:          string | null;
  situacao_cadastral: string | null;
  porte:              string | null;
}

interface BrasilIoResponse {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  EmpresaBrasilIo[];
}

export async function buscarEmpresasPorCnae(
  cnae: string,
  uf: string,
  situacao = 'ATIVA',
  pagina = 1,
  municipio?: string
): Promise<BrasilIoResponse> {
  const { data } = await axios.get<BrasilIoResponse>(BASE, {
    headers: { Authorization: `Token ${env.brasilIoToken}` },
    params: {
      cnae_fiscal:        cnae,
      uf,
      situacao_cadastral: situacao,
      format:             'json',
      page:               pagina,
      ...(municipio ? { municipio } : {}),
    },
  });
  return data;
}