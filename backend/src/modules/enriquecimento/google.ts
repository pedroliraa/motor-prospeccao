import axios from 'axios';
import { env } from '../../config/loadConfig.js';

const BASE = 'https://maps.googleapis.com/maps/api/place';

interface GoogleResult {
  googleNota: number | null;
  googleAvaliacoes: number | null;
}

export async function buscarDadosGoogle(
  nomeEmpresa: string,
  cidade: string
): Promise<GoogleResult> {
  try {
    // 1. Busca o lugar pelo nome + cidade
    const searchResp = await axios.get(`${BASE}/findplacefromtext/json`, {
      params: {
        input:           `${nomeEmpresa} ${cidade}`,
        inputtype:       'textquery',
        fields:          'place_id,name,rating,user_ratings_total',
        locationbias:    'country:br',
        key:             env.googleKey,
      }
    });

    const candidates = searchResp.data?.candidates;
    if (!candidates || candidates.length === 0) {
      return { googleNota: null, googleAvaliacoes: null };
    }

    const lugar = candidates[0];

    return {
      googleNota:       lugar.rating             ?? null,
      googleAvaliacoes: lugar.user_ratings_total ?? null,
    };

  } catch (err: any) {
    console.error(`  [Google] Erro para ${nomeEmpresa}:`, err?.response?.data?.error_message ?? err.message);
    return { googleNota: null, googleAvaliacoes: null };
  }
}