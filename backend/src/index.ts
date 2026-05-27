import { prisma } from "./db/prisma";
import { loadConfig } from "./config/loadConfig";

async function main() {
  console.log("Motor de Prospecção iniciado");

  const config = loadConfig();

  console.log("CONFIG CARREGADA:");
  console.log(config);

  await prisma.execucao.create({
    data: {
      segmento: config.segmento
    }
  });

  console.log("Execução criada no banco");
}

main();