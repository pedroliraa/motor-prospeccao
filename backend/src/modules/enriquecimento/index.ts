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

function mapearPorte(codigo: string): string {
  const portes: Record<string, string> = {
    '00': 'Não informado',
    '01': 'Micro Empresa',
    '03': 'Empresa de Pequeno Porte',
    '05': 'Demais',
  };
  return portes[codigo] ?? codigo;
}

async function carregarCnpjsNoBanco(): Promise<Map<string, string[]>> {
  const empresas = await prisma.empresa.findMany({ select: { cnpj: true } });
  const mapa = new Map<string, string[]>();
  for (const emp of empresas) {
    const cnpjBasico = emp.cnpj.substring(0, 8);
    if (!mapa.has(cnpjBasico)) mapa.set(cnpjBasico, []);
    mapa.get(cnpjBasico)!.push(emp.cnpj);
  }
  console.log(`CNPJs no banco: ${mapa.size} bases · ${empresas.length} total`);
  return mapa;
}

async function enriquecerComEmpresas(cnpjsNoBanco: Map<string, string[]>) {
  const arquivos = readdirSync(path.resolve('data'))
    .filter(f => f.includes('EMPRECSV'))
    .sort();

  console.log(`\nCarregando ${arquivos.length} arquivos EMPRECSV...`);

  const mapa = new Map<string, { razaoSocial: string; porte: string; capitalSocial: string; dataAbertura: string }>();

  for (const arquivo of arquivos) {
    process.stdout.write(`  ${arquivo}... `);
    let count = 0;

    await lerLinhas(path.resolve('data', arquivo), col => {
      const cnpjBasico = col[0] ?? '';
      if (!cnpjsNoBanco.has(cnpjBasico)) return;
      count++;
      mapa.set(cnpjBasico, {
        razaoSocial: col[1] ?? '',
        capitalSocial: col[4] ?? '',
        porte: col[5] ?? '',
        dataAbertura: col[7] ?? '',
      });
    });

    console.log(`${count} encontrados`);
  }

  let atualizadas = 0;
  for (const [cnpjBasico, dados] of mapa) {
    const cnpjs = cnpjsNoBanco.get(cnpjBasico)!;
    for (const cnpj of cnpjs) {
      await prisma.empresa.update({
        where: { cnpj },
        data: {
          razaoSocial: dados.razaoSocial || null,
          porte: mapearPorte(dados.porte),
          capitalSocial: parseFloat(dados.capitalSocial.replace(',', '.')) || null,
          dataAbertura: dados.dataAbertura ? new Date(
            dados.dataAbertura.slice(0, 4) + '-' +
            dados.dataAbertura.slice(4, 6) + '-' +
            dados.dataAbertura.slice(6, 8)
          ) : null,
        },
      });
    }
    atualizadas++;
  }
  console.log(`Empresas atualizadas com EMPRECSV: ${atualizadas}`);
}

async function enriquecerComSimples(cnpjsNoBanco: Map<string, string[]>) {
  console.log('\nCarregando SIMPLES...');
  const simplesFile = readdirSync(path.resolve('data')).find(f => f.includes('SIMPLES'))!;
  const filePath = path.resolve('data', simplesFile);
  const mapa = new Map<string, string>();

  await lerLinhas(filePath, col => {
    const cnpjBasico = col[0] ?? '';
    if (!cnpjsNoBanco.has(cnpjBasico)) return;
    const simples = col[1] === 'S';
    const mei = col[4] === 'S';
    if (mei) mapa.set(cnpjBasico, 'MEI');
    else if (simples) mapa.set(cnpjBasico, 'Simples Nacional');
    else mapa.set(cnpjBasico, 'Lucro Presumido/Real');
  });

  let atualizadas = 0;
  for (const [cnpjBasico, regime] of mapa) {
    const cnpjs = cnpjsNoBanco.get(cnpjBasico)!;
    for (const cnpj of cnpjs) {
      await prisma.empresa.update({
        where: { cnpj },
        data: { regimeTributario: regime },
      });
    }
    atualizadas++;
  }
  console.log(`Regime tributário atualizado: ${atualizadas}`);

  let lucroReal = 0;
  for (const [cnpjBasico, cnpjs] of cnpjsNoBanco) {
    if (!mapa.has(cnpjBasico)) {
      for (const cnpj of cnpjs) {
        await prisma.empresa.update({
          where: { cnpj },
          data: { regimeTributario: 'Lucro Real' },
        });
        lucroReal++;
      }
    }
  }
  console.log(`Lucro Real atribuído a: ${lucroReal} empresas`);
}

async function enriquecerComSocios(cnpjsNoBanco: Map<string, string[]>) {
  const arquivos = readdirSync(path.resolve('data'))
    .filter(f => f.includes('SOCIOCSV'))
    .sort();

  console.log(`\nCarregando ${arquivos.length} arquivos SOCIOCSV...`);

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
    const cnpjs = cnpjsNoBanco.get(cnpjBasico)!;
    for (const cnpj of cnpjs) {
      await prisma.empresa.update({
        where: { cnpj },
        data: { socios: JSON.stringify(socios) },
      });
    }
    atualizadas++;
  }
  console.log(`Sócios atualizados: ${atualizadas}`);
}

async function enriquecerComFaturamento() {
  console.log('\nCalculando faturamento estimado...');

  const empresas = await prisma.empresa.findMany({
    select: { id: true, regimeTributario: true, porte: true }
  });

  let atualizadas = 0;
  for (const emp of empresas) {
    const regime = emp.regimeTributario ?? '';
    const porte = emp.porte ?? '';

    let faturamento = 'Não estimado';

    if (regime === 'MEI') {
      faturamento = 'Até R$ 81k/ano';
    } else if (regime === 'Simples Nacional' && porte === 'Micro Empresa') {
      faturamento = 'Até R$ 360k/ano';
    } else if (regime === 'Simples Nacional' && porte === 'Empresa de Pequeno Porte') {
      faturamento = 'R$ 360k a R$ 4,8M/ano';
    } else if (regime === 'Simples Nacional') {
      faturamento = 'Até R$ 4,8M/ano';
    } else if (regime === 'Lucro Presumido/Real') {
      faturamento = 'R$ 4,8M a R$ 78M/ano';
    } else if (regime === 'Lucro Real') {
      faturamento = 'Acima de R$ 78M/ano';
    }

    await prisma.empresa.update({
      where: { id: emp.id },
      data: { faturamentoEstimado: faturamento }
    });
    atualizadas++;
  }
  console.log(`Faturamento estimado para ${atualizadas} empresas`);
}

export async function executarEnriquecimento() {
  console.log('Iniciando enriquecimento...\n');

  const cnpjsNoBanco = await carregarCnpjsNoBanco();

  await enriquecerComEmpresas(cnpjsNoBanco);
  await enriquecerComSimples(cnpjsNoBanco);
  await enriquecerComFaturamento();
  await enriquecerComSocios(cnpjsNoBanco);

  await prisma.empresa.updateMany({
    where: { status: 'pendente_enriquecimento' },
    data: { status: 'enriquecido' },
  });

  console.log('\nEnriquecimento concluído!');
  await prisma.$disconnect();
}