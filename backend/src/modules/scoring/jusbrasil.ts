import axios from 'axios';
import * as cheerio from 'cheerio';

export async function verificarProcessos(cnpj: string): Promise<{
  temProcessos: boolean | null;
  quantidade: number | null;
}> {
  try {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    const { data } = await axios.get(
      `https://www.jusbrasil.com.br/consulta-processual/busca?q=${cnpjLimpo}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(data);

    // tenta encontrar indicador de processos na página
    const texto = $('body').text().toLowerCase();

    if (texto.includes('nenhum resultado') || texto.includes('não encontrado')) {
      return { temProcessos: false, quantidade: 0 };
    }

    // conta resultados se encontrar
    const resultados = $('.result-item, .processo-item, [class*="result"]').length;
    if (resultados > 0) {
      return { temProcessos: true, quantidade: resultados };
    }

    // se carregou mas não identificou claramente
    return { temProcessos: null, quantidade: null };

  } catch (err: any) {
    // bloqueado ou timeout — retorna não verificado
    console.log(`  [JusBrasil] Não verificado para ${cnpj}: ${err.message}`);
    return { temProcessos: null, quantidade: null };
  }
}