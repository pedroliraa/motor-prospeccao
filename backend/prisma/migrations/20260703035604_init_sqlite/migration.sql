-- CreateTable
CREATE TABLE "Empresa" (
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
    "faturamentoEstimado" TEXT,
    "qtdeFuncionarios" TEXT,
    "dataAbertura" DATETIME,
    "socios" TEXT,
    "instagramHandle" TEXT,
    "instagramSeguidores" INTEGER,
    "instagramStatus" TEXT,
    "googleNota" REAL,
    "googleAvaliacoes" INTEGER,
    "whatsapp" TEXT,
    "score" INTEGER,
    "classificacao" TEXT,
    "justificativa" TEXT,
    "execucaoId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pendente_enriquecimento',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Execucao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "segmento" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "totalEmpresas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Etiqueta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6B7280'
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Busca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "segmento" TEXT NOT NULL,
    "filtros" TEXT NOT NULL,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Busca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Etiqueta_nome_key" ON "Etiqueta"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
