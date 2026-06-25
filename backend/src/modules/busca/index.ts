import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { readdirSync } from 'fs';
import path from 'path';
import { config } from '../../config/loadConfig.js';

export interface EmpresaRFB {
  cnpj: string;
  nome_fantasia: string;
  cnae_fiscal: string;
  cnae_descricao: string;
  municipio: string;
  uf: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  dataAbertura: string;
  telefone1: string;
  telefone2: string;
  email: string;
}

async function lerLinhas(filePath: string, onLinha: (col: string[]) => void) {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });
  for await (const linha of rl) {
    const col = linha.split(';').map(c => c.replace(/"/g, '').trim());
    onLinha(col);
  }
}

async function carregarMunicipios(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  await lerLinhas(path.resolve('data/F.K03200$Z.D60509.MUNICCSV'), col => {
    if (col.length >= 2) mapa.set(col[0], col[1].toUpperCase());
  });
  console.log(`Municípios: ${mapa.size}`);
  return mapa;
}

async function carregarCnaes(): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  await lerLinhas(path.resolve('data/F.K03200$Z.D60509.CNAECSV'), col => {
    if (col.length >= 2) mapa.set(col[0].replace(/[-\/]/g, ''), col[1]);
  });
  console.log(`CNAEs: ${mapa.size}`);
  return mapa;
}

export async function executarBusca(somentePrimario = false): Promise<EmpresaRFB[]> {
  const { cnaes, filtros } = config;
  const municipiosAlvo = (filtros.municipios as string[]).map((m: string) => m.toUpperCase());
  const estados = filtros.estados as string[];
  const cnaeSet = new Set(cnaes.map((c: string) => c.replace(/[-\/]/g, '')));

  console.log('Carregando municípios...');
  const tabelaMunicipios = await carregarMunicipios();

  console.log('Carregando CNAEs...');
  const tabelaCnaes = await carregarCnaes();

  const codigosMunicipios = new Set<string>();
  for (const [codigo, nome] of tabelaMunicipios) {
    if (municipiosAlvo.includes(nome)) codigosMunicipios.add(codigo);
  }
  console.log(`Códigos municípios alvo: ${[...codigosMunicipios].join(', ')}`);

  const arquivosEstab = readdirSync(path.resolve('data'))
    .filter(f => f.includes('ESTABELE'))
    .sort();

  console.log(`\nLendo ${arquivosEstab.length} arquivos de estabelecimentos...\n`);

  const mapa = new Map<string, EmpresaRFB>();

  for (const arquivo of arquivosEstab) {
    let count = 0;
    process.stdout.write(`  ${arquivo}... `);

    await lerLinhas(path.resolve('data', arquivo), col => {
      count++;

      const cnae = (col[11] ?? '').replace(/[-\/]/g, '');
      const uf = (col[19] ?? '').toUpperCase();
      const municipioCodigo = col[20] ?? '';
      const situacao = col[5] ?? '';

      if (somentePrimario) {
        // só aceita se o CNAE principal (col[11]) estiver na lista
        if (!cnaeSet.has(cnae)) return;
      } else {
        // aceita se qualquer CNAE secundário (col[12]) também estiver na lista
        const cnaesSecundarios = (col[12] ?? '').split(',').map(c => c.replace(/[-\/]/g, '').trim());
        const temMatch = cnaeSet.has(cnae) || cnaesSecundarios.some(c => cnaeSet.has(c));
        if (!temMatch) return;
      }
      if (!estados.includes(uf)) return;
      if (codigosMunicipios.size > 0 && !codigosMunicipios.has(municipioCodigo)) return;
      if (situacao !== '02') return;

      // log temporário
      if (mapa.size < 3) {
        console.log(`dataAbertura col[10]: "${col[10]}"`);
      }

      const cnpj = (col[0] ?? '') + (col[1] ?? '') + (col[2] ?? '');

      if (!mapa.has(cnpj)) {
        mapa.set(cnpj, {
          cnpj,
          nome_fantasia: col[4] ?? '',
          cnae_fiscal: col[11] ?? '',
          cnae_descricao: tabelaCnaes.get(cnae) ?? '',
          municipio: tabelaMunicipios.get(municipioCodigo) ?? '',
          uf,
          logradouro: (col[13] ?? '') + ' ' + (col[14] ?? ''),
          numero: col[15] ?? '',
          bairro: col[17] ?? '',
          cep: col[18] ?? '',
          dataAbertura: col[10] ?? '',
          telefone1: (col[21] ?? '') + (col[22] ?? ''),
          telefone2: (col[23] ?? '') + (col[24] ?? ''),
          email: col[27] ?? '',
        });
      }
    });

    console.log(`${count.toLocaleString()} linhas | ${mapa.size} encontradas`);
  }

  const empresas = Array.from(mapa.values());
  console.log(`\nResultado final: ${empresas.length} empresas`);
  return empresas;
}