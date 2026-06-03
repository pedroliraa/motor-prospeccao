import Anthropic from '@anthropic-ai/sdk';
import pLimit from 'p-limit';
import prisma from '../../db/prisma.js';
import { verificarProcessos } from './jusbrasil.js';
import { env } from '../../config/loadConfig.js';

const client = new Anthropic({ apiKey: env.anthropicKey });

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function montarPrompt(emp: any): string {
    const socios = emp.socios ? JSON.parse(emp.socios).join(', ') : 'Não identificado';

    return `Você é um analista B2B. Avalie este lead e retorne SOMENTE um JSON válido, sem texto adicional.

Formato obrigatório: {"score":50,"classificacao":"Morno","justificativa":"Uma frase."}

Lead:
- Empresa: ${emp.nomeFantasia || emp.razaoSocial || 'N/A'}
- Cidade: ${emp.cidade}/${emp.estado}
- Porte: ${emp.porte || 'N/A'} | Capital: ${emp.capitalSocial ? 'R$' + emp.capitalSocial : 'N/A'}
- Regime: ${emp.regimeTributario || 'N/A'}
- Google: ${emp.googleNota ? emp.googleNota + 'estrelas, ' + emp.googleAvaliacoes + ' avaliações' : 'sem perfil'}
- Sócios: ${socios}
- Processos: ${emp.processosJudiciais || 'não verificado'}

Regras: score 80-100=Quente, 50-79=Morno, 0-49=Frio. Simples Nacional + capital alto + Google ativo = score alto.`;
}

async function scorarEmpresa(emp: any): Promise<{
    score: number;
    classificacao: string;
    justificativa: string;
}> {
    const msg = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 150,
        messages: [{ role: 'user', content: montarPrompt(emp) }],
    });

    const texto = msg.content[0].type === 'text' ? msg.content[0].text : '{}';

    try {
        // remove possível markdown que a IA adicione
        const limpo = texto.trim()
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
        const parsed = JSON.parse(limpo);
        return {
            score: Number(parsed.score) || 0,
            classificacao: parsed.classificacao || 'Frio',
            justificativa: parsed.justificativa || '',
        };
    } catch {
        // tenta extrair com regex se o JSON vier malformado
        const scoreMatch = texto.match(/"score"\s*:\s*(\d+)/);
        const classMatch = texto.match(/"classificacao"\s*:\s*"([^"]+)"/);
        const justMatch = texto.match(/"justificativa"\s*:\s*"([^"]+)"/);

        if (scoreMatch) {
            return {
                score: Number(scoreMatch[1]),
                classificacao: classMatch?.[1] || 'Frio',
                justificativa: justMatch?.[1] || '',
            };
        }
        return { score: 0, classificacao: 'Frio', justificativa: 'Erro ao processar.' };
    }
}

export async function executarScoring(limite = 9999) {
    const empresas = await prisma.empresa.findMany({
        where: { score: null, status: 'enriquecido' },
        take: limite,
    });
    console.log('Iniciando scoring...\n');

    /*const empresas = await prisma.empresa.findMany({
      where: { score: null, status: 'enriquecido' },
    });*/

    console.log(`Empresas a scorar: ${empresas.length}`);

    const limit = pLimit(3); // 3 em paralelo
    let processadas = 0;
    let erros = 0;

    await Promise.all(
        empresas.map(emp =>
            limit(async () => {
                try {
                    // 1. verifica processos no JusBrasil
                    const processos = await verificarProcessos(emp.cnpj);

                    // 2. scoring com Claude
                    const scoring = await scorarEmpresa({
                        ...emp,
                        processosJudiciais: processos.temProcessos === true
                            ? `Sim (${processos.quantidade} encontrados)`
                            : processos.temProcessos === false
                                ? 'Não'
                                : 'Não verificado',
                    });

                    // 3. salva tudo no banco
                    await prisma.empresa.update({
                        where: { id: emp.id },
                        data: {
                            score: scoring.score,
                            classificacao: scoring.classificacao,
                            justificativa: scoring.justificativa,
                            status: 'qualificado',
                        },
                    });

                    processadas++;
                    if (processadas % 20 === 0) {
                        console.log(`  ${processadas}/${empresas.length} processadas`);
                    }

                    await sleep(300);
                } catch (err: any) {
                    erros++;
                    console.error(`  Erro empresa ${emp.id}:`, err.message);
                }
            })
        )
    );

    console.log(`\nScoring concluído: ${processadas} processadas | ${erros} erros`);

    // atualiza status das execuções
    await prisma.empresa.updateMany({
        where: { status: 'qualificado' },
        data: { status: 'qualificado' },
    });

    await prisma.$disconnect();
}