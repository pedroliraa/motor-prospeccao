import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { readdirSync } from 'fs';
import path from 'path';
import prisma from '../../db/prisma.js';

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

// carrega só os cnpj_basico das empresas que estão no banco
async function carregarCnpjsNoBanco(): Promise<Map<string, string>> {
  const empresas = await prisma.empresa.findMany({
    select: { cnpj: true, id: true }
  });
  const mapa = new Map<string, string>();
  for (const emp of empresas) {
    const cnpjBasico = emp.cnpj.substring(0, 8);
    mapa.set(cnpjBasico, emp.cnpj);
  }
  console.log(`CNPJs no banco: ${mapa.size}`);
  return mapa;
}

async function enriquecerComEmpresas(cnpjsNoBanco: Map<string, string>) {
  const arquivos = readdirSync(path.resolve('data'))
    .filter(f => f.includes('EMPRECSV'))
    .sort();

  console.log(`\nCarregando ${arquivos.length} arquivos EMPRECSV...`);

  // cnpj_basico -> dados
  const mapa = new Map<string, { razaoSocial: string; porte: string; capitalSocial: string }>();

  for (const arquivo of arquivos) {
    process.stdout.write(`  ${arquivo}... `);
    let count = 0;

    await lerLinhas(path.resolve('data', arquivo), col => {
      const cnpjBasico = col[0] ?? '';
      if (!cnpjsNoBanco.has(cnpjBasico)) return;
      count++;
      mapa.set(cnpjBasico, {
        razaoSocial:  col[1] ?? '',
        capitalSocial: col[4] ?? '',
        porte:        col[5] ?? '',
      });
    });

    console.log(`${count} encontrados`);
  }

  // salva no banco
  let atualizadas = 0;
  for (const [cnpjBasico, dados] of mapa) {
    const cnpj = cnpjsNoBanco.get(cnpjBasico)!;
    await prisma.empresa.update({
      where: { cnpj },
      data: {
        razaoSocial:  dados.razaoSocial  || null,
        porte:        mapearPorte(dados.porte),
        capitalSocial: parseFloat(dados.capitalSocial.replace(',', '.')) || null,
      },
    });
    atualizadas++;
  }
  console.log(`Empresas atualizadas com EMPRECSV: ${atualizadas}`);
}

async function enriquecerComSimples(cnpjsNoBanco: Map<string, string>) {
  console.log('\nCarregando SIMPLES...');
  const filePath = path.resolve('data/F.K03200$W.SIMPLES.CSV.D60509');
  const mapa = new Map<string, string>();

  await lerLinhas(filePath, col => {
    const cnpjBasico = col[0] ?? '';
    if (!cnpjsNoBanco.has(cnpjBasico)) return;
    const simples = col[1] === 'S';
    const mei     = col[4] === 'S';
    if (mei)          mapa.set(cnpjBasico, 'MEI');
    else if (simples) mapa.set(cnpjBasico, 'Simples Nacional');
    else              mapa.set(cnpjBasico, 'Lucro Presumido/Real');
  });

  let atualizadas = 0;
  for (const [cnpjBasico, regime] of mapa) {
    const cnpj = cnpjsNoBanco.get(cnpjBasico)!;
    await prisma.empresa.update({
      where: { cnpj },
      data:  { regimeTributario: regime },
    });
    atualizadas++;
  }
  console.log(`Regime tributário atualizado: ${atualizadas}`);
}

async function enriquecerComSocios(cnpjsNoBanco: Map<string, string>) {
  const arquivos = readdirSync(path.resolve('data'))
    .filter(f => f.includes('SOCIOCSV'))
    .sort();

  console.log(`\nCarregando ${arquivos.length} arquivos SOCIOCSV...`);

  // cnpj_basico -> lista de sócios
  const mapa = new Map<string, string[]>();

  for (const arquivo of arquivos) {
    process.stdout.write(`  ${arquivo}... `);
    let count = 0;

    await lerLinhas(path.resolve('data', arquivo), col => {
      const cnpjBasico = col[0] ?? '';
      if (!cnpjsNoBanco.has(cnpjBasico)) return;
      count++;
      const nomeSocio = col[2] ?? '';
      if (!mapa.has(cnpjBasico)) mapa.set(cnpjBasico, []);
      mapa.get(cnpjBasico)!.push(nomeSocio);
    });

    console.log(`${count} encontrados`);
  }

  let atualizadas = 0;
  for (const [cnpjBasico, socios] of mapa) {
    const cnpj = cnpjsNoBanco.get(cnpjBasico)!;
    await prisma.empresa.update({
      where: { cnpj },
      data:  { socios: JSON.stringify(socios) },
    });
    atualizadas++;
  }
  console.log(`Sócios atualizados: ${atualizadas}`);
}

function mapearPorte(codigo: string): string {
  const portes: Record<string, string> = {
    '00': 'Não informado',
    '01': 'Micro Empresa',
    '03': 'Empresa de Pequeno Porte',
    '05': 'Demais',
  };
  return portes[codigo] ?? codigo;
}

export async function executarEnriquecimento() {
  console.log('Iniciando enriquecimento...\n');

  const cnpjsNoBanco = await carregarCnpjsNoBanco();

  await enriquecerComEmpresas(cnpjsNoBanco);
  await enriquecerComSimples(cnpjsNoBanco);
  await enriquecerComSocios(cnpjsNoBanco);

  // atualiza status
  await prisma.empresa.updateMany({
    where: { status: 'pendente_enriquecimento' },
    data:  { status: 'enriquecido' },
  });

  console.log('\nEnriquecimento concluído!');
  await prisma.$disconnect();
}