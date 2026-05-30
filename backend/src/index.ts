import 'dotenv/config';
import { executarBusca } from './modules/busca/index.js';
import prisma from './db/prisma.js';

async function main() {
  console.log('Iniciando busca...\n');
  const empresas = await executarBusca();

  console.log(`\nSalvando ${empresas.length} empresas no banco...`);

  let salvas = 0;
  let ignoradas = 0;

  for (const emp of empresas) {
    try {
      await prisma.empresa.upsert({
        where:  { cnpj: emp.cnpj },
        update: {},  // não sobrescreve se já existir
        create: {
          cnpj:         emp.cnpj,
          nomeFantasia: emp.nome_fantasia || null,
          cnae:         emp.cnae_fiscal   || null,
          cnaeDescricao: emp.cnae_descricao || null,
          logradouro:   emp.logradouro    || null,
          numero:       emp.numero        || null,
          bairro:       emp.bairro        || null,
          cep:          emp.cep           || null,
          cidade:       emp.municipio     || null,
          estado:       emp.uf            || null,
          telefone1:    emp.telefone1     || null,
          telefone2:    emp.telefone2     || null,
          email:        emp.email         || null,
          status:       'pendente_enriquecimento',
        },
      });
      salvas++;
    } catch (e) {
      ignoradas++;
    }
  }

  console.log(`Salvas: ${salvas} | Ignoradas: ${ignoradas}`);
  await prisma.$disconnect();
}

main().catch(console.error);