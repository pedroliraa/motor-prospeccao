/*
  Warnings:

  - You are about to drop the `Lead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `telefone` on the `Empresa` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Lead";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "nomeFantasia" TEXT,
    "cnae" TEXT,
    "cnaeDescricao" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "telefone1" TEXT,
    "telefone2" TEXT,
    "email" TEXT,
    "capitalSocial" REAL,
    "regimeTributario" TEXT,
    "porte" TEXT,
    "dataAbertura" DATETIME,
    "socios" TEXT,
    "instagramHandle" TEXT,
    "instagramSeguidores" INTEGER,
    "instagramStatus" TEXT,
    "googleNota" REAL,
    "googleAvaliacoes" INTEGER,
    "score" INTEGER,
    "classificacao" TEXT,
    "justificativa" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente_enriquecimento',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Empresa" ("capitalSocial", "cidade", "cnpj", "createdAt", "dataAbertura", "estado", "id", "nomeFantasia", "porte", "razaoSocial", "regimeTributario", "status", "updatedAt") SELECT "capitalSocial", "cidade", "cnpj", "createdAt", "dataAbertura", "estado", "id", "nomeFantasia", "porte", "razaoSocial", "regimeTributario", "status", "updatedAt" FROM "Empresa";
DROP TABLE "Empresa";
ALTER TABLE "new_Empresa" RENAME TO "Empresa";
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
