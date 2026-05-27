-- CreateTable
CREATE TABLE "Empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "telefone" TEXT,
    "capitalSocial" REAL,
    "regimeTributario" TEXT,
    "porte" TEXT,
    "dataAbertura" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pendente_enriquecimento',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresaId" INTEGER NOT NULL,
    "score" INTEGER,
    "classificacao" TEXT,
    "justificativa" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Execucao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "segmento" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "totalEmpresas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");
