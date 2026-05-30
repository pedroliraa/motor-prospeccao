import pLimit from 'p-limit';
import prisma from '../../db/prisma.js';
import { buscarDadosGoogle } from './google.js';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function executarPresencaDigital() {
  console.log('Iniciando coleta de presença digital...\n');

  // busca só as empresas que ainda não têm dados do Google
  const empresas = await prisma.empresa.findMany({
    where: { googleNota: null },
    select: { id: true, nomeFantasia: true, razaoSocial: true, cidade: true }
  });

  console.log(`Empresas a processar: ${empresas.length}`);

  const limit = pLimit(3); // 3 em paralelo
  let processadas = 0;
  let comDados = 0;

  await Promise.all(
    empresas.map(emp =>
      limit(async () => {
        const nome = emp.nomeFantasia || emp.razaoSocial || '';
        const cidade = emp.cidade || '';

        const google = await buscarDadosGoogle(nome, cidade);

        await prisma.empresa.update({
          where: { id: emp.id },
          data: {
            googleNota:       google.googleNota,
            googleAvaliacoes: google.googleAvaliacoes,
          }
        });

        if (google.googleNota) comDados++;
        processadas++;

        if (processadas % 50 === 0) {
          console.log(`  ${processadas}/${empresas.length} processadas | com Google: ${comDados}`);
        }

        await sleep(200); // respeita rate limit
      })
    )
  );

  console.log(`\nConcluído: ${processadas} empresas | com dados Google: ${comDados}`);
  return { processadas, comDados };
}