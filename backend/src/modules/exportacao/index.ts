import ExcelJS from 'exceljs';
import path from 'path';
import prisma from '../../db/prisma.js';

export async function gerarExcel(): Promise<string> {
  const empresas = await prisma.empresa.findMany({
    orderBy: { score: 'desc' },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Leads Qualificados');

  // cabeçalho
  ws.columns = [
    { header: 'CNPJ',             key: 'cnpj',             width: 20 },
    { header: 'Razão Social',     key: 'razaoSocial',      width: 35 },
    { header: 'Nome Fantasia',    key: 'nomeFantasia',     width: 30 },
    { header: 'CNAE',             key: 'cnae',             width: 12 },
    { header: 'Descrição CNAE',   key: 'cnaeDescricao',    width: 40 },
    { header: 'Cidade',           key: 'cidade',           width: 20 },
    { header: 'Estado',           key: 'estado',           width: 8  },
    { header: 'Bairro',           key: 'bairro',           width: 20 },
    { header: 'Logradouro',       key: 'logradouro',       width: 35 },
    { header: 'Número',           key: 'numero',           width: 8  },
    { header: 'CEP',              key: 'cep',              width: 12 },
    { header: 'Telefone 1',       key: 'telefone1',        width: 16 },
    { header: 'Telefone 2',       key: 'telefone2',        width: 16 },
    { header: 'Email',            key: 'email',            width: 30 },
    { header: 'Porte',            key: 'porte',            width: 20 },
    { header: 'Capital Social',   key: 'capitalSocial',    width: 16 },
    { header: 'Regime Tributário',key: 'regimeTributario', width: 22 },
    { header: 'Sócios',           key: 'socios',           width: 40 },
    { header: 'Google Nota',      key: 'googleNota',       width: 14 },
    { header: 'Google Avaliações',key: 'googleAvaliacoes', width: 18 },
    { header: 'Score',            key: 'score',            width: 8  },
    { header: 'Classificação',    key: 'classificacao',    width: 14 },
    { header: 'Justificativa IA', key: 'justificativa',    width: 60 },
  ];

  // estilo do cabeçalho
  ws.getRow(1).eachCell(cell => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E2A3A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border    = {
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
  });
  ws.getRow(1).height = 22;

  // dados
  for (const emp of empresas) {
    const socios = emp.socios
      ? JSON.parse(emp.socios).join(', ')
      : '';

    const row = ws.addRow({
      cnpj:            emp.cnpj,
      razaoSocial:     emp.razaoSocial     || '',
      nomeFantasia:    emp.nomeFantasia     || '',
      cnae:            emp.cnae             || '',
      cnaeDescricao:   emp.cnaeDescricao    || '',
      cidade:          emp.cidade           || '',
      estado:          emp.estado           || '',
      bairro:          emp.bairro           || '',
      logradouro:      emp.logradouro       || '',
      numero:          emp.numero           || '',
      cep:             emp.cep              || '',
      telefone1:       emp.telefone1        || '',
      telefone2:       emp.telefone2        || '',
      email:           emp.email            || '',
      porte:           emp.porte            || '',
      capitalSocial:   emp.capitalSocial    ?? '',
      regimeTributario:emp.regimeTributario || '',
      socios,
      googleNota:      emp.googleNota       ?? '',
      googleAvaliacoes:emp.googleAvaliacoes ?? '',
      score:           emp.score            ?? '',
      classificacao:   emp.classificacao    || '',
      justificativa:   emp.justificativa    || '',
    });

    // cor por classificação
    const cor =
      emp.classificacao === 'Quente' ? 'FFD1FAE5' :
      emp.classificacao === 'Morno'  ? 'FFFEF9C3' :
      emp.classificacao === 'Frio'   ? 'FFF3F4F6' : 'FFFFFFFF';

    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cor } };
      cell.alignment = { vertical: 'middle', wrapText: false };
    });
  }

  // congela primeira linha e ativa filtro
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: 'W1' };

  // salva
  const outputPath = path.resolve('output/leads.xlsx');
  const { mkdirSync } = await import('fs');
  mkdirSync(path.resolve('output'), { recursive: true });
  await wb.xlsx.writeFile(outputPath);

  console.log(`Excel gerado: ${outputPath}`);
  return outputPath;
}