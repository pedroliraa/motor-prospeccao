import dotenv from 'dotenv';
import express from 'express';
import { executarBusca } from './modules/busca/index.js';
import { executarEnriquecimento } from './modules/enriquecimento/index.js';
import { executarScoring } from './modules/scoring/index.js';
import prisma from './db/prisma.js';
import { gerarExcel } from './modules/exportacao/index.js';
import { executarPresencaDigital } from './modules/enriquecimento/presencaDigital.js';
import cors from 'cors';

dotenv.config({ path: '.env' });

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// inicia uma busca
app.post('/api/execucoes', async (_req, res) => {
  console.log('>>> Endpoint /api/execucoes chamado');
  try {
    const execucao = await prisma.execucao.create({
      data: {
        segmento: 'Material de Construção',
        status: 'processando',
      },
    });


    res.json({ id: execucao.id, status: 'processando' });
    console.log('>>> Chamando executarBusca em background...');
    executarBusca()
      .then(async empresas => {
        console.log(`>>> executarBusca retornou ${empresas.length} empresas`);
        let salvas = 0;

        for (const emp of empresas) {
          try {
            await prisma.empresa.upsert({
              where: { cnpj: emp.cnpj },
              update: {
                dataAbertura: emp.dataAbertura ? new Date(
                  emp.dataAbertura.slice(0, 4) + '-' +
                  emp.dataAbertura.slice(4, 6) + '-' +
                  emp.dataAbertura.slice(6, 8)
                ) : undefined,
              },
              create: {
                cnpj: emp.cnpj,
                nomeFantasia: emp.nome_fantasia || null,
                cnae: emp.cnae_fiscal || null,
                cnaeDescricao: emp.cnae_descricao || null,
                logradouro: emp.logradouro || null,
                numero: emp.numero || null,
                bairro: emp.bairro || null,
                cep: emp.cep || null,
                dataAbertura: emp.dataAbertura ? new Date(
                  emp.dataAbertura.slice(0, 4) + '-' +
                  emp.dataAbertura.slice(4, 6) + '-' +
                  emp.dataAbertura.slice(6, 8)
                ) : null,
                cidade: emp.municipio || null,
                estado: emp.uf || null,
                telefone1: emp.telefone1 || null,
                telefone2: emp.telefone2 || null,
                email: emp.email || null,
                status: 'pendente_enriquecimento',
              },
            });
            salvas++;
          } catch { }
        }

        await prisma.execucao.update({
          where: { id: execucao.id },
          data: { status: 'concluido', totalEmpresas: salvas },
        });

        console.log(`Execução ${execucao.id} concluída — ${salvas} empresas salvas`);
      })
      .catch(async err => {
        await prisma.execucao.update({
          where: { id: execucao.id },
          data: { status: 'erro' },
        });
        console.error('Erro na execução:', err);
      });

  } catch (err) {
    res.status(500).json({ error: 'Erro ao iniciar execução' });
  }
});

// status de uma execução
app.get('/api/execucoes/:id', async (req, res) => {
  const execucao = await prisma.execucao.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!execucao) return res.status(404).json({ error: 'Não encontrado' });
  res.json(execucao);
});

// lista leads do banco
app.get('/api/leads', async (req, res) => {
  const empresas = await prisma.empresa.findMany({
    orderBy: { score: 'desc' },
    take: 100,
  });
  res.json(empresas);
});

// inicia enriquecimento
app.post('/api/enriquecimento', async (_req, res) => {
  res.json({ status: 'processando' });
  executarEnriquecimento().catch(console.error);
});

// status do enriquecimento
app.get('/api/enriquecimento/status', async (_req, res) => {
  const total = await prisma.empresa.count();
  const enriquecidas = await prisma.empresa.count({ where: { status: 'enriquecido' } });
  const pendentes = await prisma.empresa.count({ where: { status: 'pendente_enriquecimento' } });
  res.json({ total, enriquecidas, pendentes });
});


// coleta presença digital
app.post('/api/presenca-digital', async (_req, res) => {
  res.json({ status: 'processando' });
  executarPresencaDigital().catch(console.error);
});

// status da presença digital
app.get('/api/presenca-digital/status', async (_req, res) => {
  const total = await prisma.empresa.count();
  const comGoogle = await prisma.empresa.count({ where: { googleNota: { not: null } } });
  const semGoogle = await prisma.empresa.count({ where: { googleNota: null } });
  res.json({ total, comGoogle, semGoogle });
});

// inicia scoring
app.post('/api/scoring', async (req, res) => {
  const limite = Number(req.query.limite) || 9999;
  res.json({ status: 'processando' });
  executarScoring(limite).catch(console.error);
});

// status do scoring
app.get('/api/scoring/status', async (_req, res) => {
  const total = await prisma.empresa.count();
  const qualificadas = await prisma.empresa.count({ where: { score: { not: null } } });
  const pendentes = await prisma.empresa.count({ where: { score: null } });
  const quentes = await prisma.empresa.count({ where: { classificacao: 'Quente' } });
  const mornos = await prisma.empresa.count({ where: { classificacao: 'Morno' } });
  const frios = await prisma.empresa.count({ where: { classificacao: 'Frio' } });
  res.json({ total, qualificadas, pendentes, quentes, mornos, frios });
});

//reset do scoring
app.post('/api/scoring/reset', async (_req, res) => {
  const limite = Number(_req.query.limite) || 10;
  await prisma.empresa.updateMany({
    where: { id: { lte: limite } },
    data: { score: null, classificacao: null, justificativa: null, status: 'enriquecido' }
  });
  res.json({ ok: true, resetadas: limite });
});

// gera e baixa Excel
app.get('/api/export/excel', async (_req, res) => {
  try {
    const filePath = await gerarExcel();
    res.download(filePath, 'leads_qualificados.xlsx');
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar Excel' });
  }
});

app.post('/api/enriquecimento/reprocessar', async (_req, res) => {
  res.json({ status: 'processando' });
  // busca só quem não tem dataAbertura ou regime
  const sem = await prisma.empresa.findMany({
    where: {
      OR: [
        { dataAbertura: null },
        { regimeTributario: null }
      ]
    },
    select: { cnpj: true }
  });
  console.log(`Reprocessando ${sem.length} empresas...`);
  executarEnriquecimento().catch(console.error);
});

app.post('/api/faturamento', async (_req, res) => {
  res.json({ status: 'processando' });

  const empresas = await prisma.empresa.findMany({
    select: { id: true, regimeTributario: true, porte: true }
  });

  console.log(`Calculando faturamento para ${empresas.length} empresas...`);

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
  }

  console.log(`Faturamento estimado para ${empresas.length} empresas`);
});

app.post('/api/atualizar-data-abertura', async (_req, res) => {
  res.json({ status: 'processando' });

  const { executarBusca } = await import('./modules/busca/index.js');
  const empresas = await executarBusca();
  let atualizadas = 0;

  for (const emp of empresas) {
    if (!emp.dataAbertura) continue;
    try {
      await prisma.empresa.update({
        where: { cnpj: emp.cnpj },
        data: {
          dataAbertura: new Date(
            emp.dataAbertura.slice(0,4) + '-' +
            emp.dataAbertura.slice(4,6) + '-' +
            emp.dataAbertura.slice(6,8)
          )
        }
      });
      atualizadas++;
    } catch {}
  }
  console.log(`Data de abertura atualizada: ${atualizadas} empresas`);
});

// classificação manual pelo SDR
app.patch('/api/leads/:id/classificacao', async (req, res) => {
  const { id } = req.params;
  const { classificacao } = req.body;
  const validas = ['Quente', 'Morno', 'Frio', null];
  if (!validas.includes(classificacao)) {
    return res.status(400).json({ error: 'Classificação inválida' });
  }
  const empresa = await prisma.empresa.update({
    where: { id: Number(id) },
    data: { classificacao },
  });
  res.json(empresa);
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// mantém o processo vivo
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
process.stdin.resume();