import 'dotenv/config';
import express from 'express';
import { executarBusca } from './modules/busca/index.js';
import { executarEnriquecimento } from './modules/enriquecimento/index.js';
import prisma from './db/prisma.js';
import { executarPresencaDigital } from './modules/enriquecimento/presencaDigital.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// inicia uma busca
app.post('/api/execucoes', async (_req, res) => {
  try {
    const execucao = await prisma.execucao.create({
      data: {
        segmento: 'Material de Construção',
        status:   'processando',
      },
    });

    res.json({ id: execucao.id, status: 'processando' });

    executarBusca()
      .then(async empresas => {
        let salvas = 0;

        for (const emp of empresas) {
          try {
            await prisma.empresa.upsert({
              where:  { cnpj: emp.cnpj },
              update: {},
              create: {
                cnpj:          emp.cnpj,
                nomeFantasia:  emp.nome_fantasia  || null,
                cnae:          emp.cnae_fiscal    || null,
                cnaeDescricao: emp.cnae_descricao || null,
                logradouro:    emp.logradouro     || null,
                numero:        emp.numero         || null,
                bairro:        emp.bairro         || null,
                cep:           emp.cep            || null,
                cidade:        emp.municipio      || null,
                estado:        emp.uf             || null,
                telefone1:     emp.telefone1      || null,
                telefone2:     emp.telefone2      || null,
                email:         emp.email          || null,
                status:        'pendente_enriquecimento',
              },
            });
            salvas++;
          } catch {}
        }

        await prisma.execucao.update({
          where: { id: execucao.id },
          data:  { status: 'concluido', totalEmpresas: salvas },
        });

        console.log(`Execução ${execucao.id} concluída — ${salvas} empresas salvas`);
      })
      .catch(async err => {
        await prisma.execucao.update({
          where: { id: execucao.id },
          data:  { status: 'erro' },
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
  const total      = await prisma.empresa.count();
  const enriquecidas = await prisma.empresa.count({ where: { status: 'enriquecido' } });
  const pendentes  = await prisma.empresa.count({ where: { status: 'pendente_enriquecimento' } });
  res.json({ total, enriquecidas, pendentes });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// coleta presença digital
app.post('/api/presenca-digital', async (_req, res) => {
  res.json({ status: 'processando' });
  executarPresencaDigital().catch(console.error);
});

// status da presença digital
app.get('/api/presenca-digital/status', async (_req, res) => {
  const total       = await prisma.empresa.count();
  const comGoogle   = await prisma.empresa.count({ where: { googleNota: { not: null } } });
  const semGoogle   = await prisma.empresa.count({ where: { googleNota: null } });
  res.json({ total, comGoogle, semGoogle });
});