'use client';

const CNAES_POR_SEGMENTO: Record<string, { codigo: string; descricao: string }[]> = {
  'Material de Construção': [
    { codigo: '4744099', descricao: 'Materiais de construção em geral' },
    { codigo: '4744003', descricao: 'Materiais hidráulicos e sanitários' },
    { codigo: '4744001', descricao: 'Ferragens e ferramentas' },
    { codigo: '4741500', descricao: 'Tintas e materiais para pintura' },
    { codigo: '4744002', descricao: 'Madeira e artefatos' },
    { codigo: '4742300', descricao: 'Materiais elétricos' },
  ],
  'Clínicas e Saúde': [
    { codigo: '8630501', descricao: 'Atividade médica ambulatorial' },
    { codigo: '8630502', descricao: 'Atividade médica com recursos para diagnóstico' },
    { codigo: '8640208', descricao: 'Serviços de diagnóstico por imagem' },
  ],
  'Restaurantes e Alimentação': [
    { codigo: '5611201', descricao: 'Restaurantes e similares' },
    { codigo: '5611203', descricao: 'Lanchonetes e similares' },
    { codigo: '5612100', descricao: 'Serviços ambulantes de alimentação' },
  ],
  'Oficinas e Automotivo': [
    { codigo: '4520001', descricao: 'Manutenção de automóveis' },
    { codigo: '4520002', descricao: 'Manutenção de veículos pesados' },
    { codigo: '4530703', descricao: 'Comércio de peças e acessórios' },
  ],
};

interface Props {
  segmento: string;
  selecionados: string[];
  onChange: (cnaes: string[]) => void;
}

export default function CnaeTags({ segmento, selecionados, onChange }: Props) {
  const opcoes = CNAES_POR_SEGMENTO[segmento] ?? [];

  function toggle(codigo: string) {
    if (selecionados.includes(codigo)) {
      onChange(selecionados.filter(c => c !== codigo));
    } else {
      onChange([...selecionados, codigo]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map(op => {
        const ativo = selecionados.includes(op.codigo);
        return (
          <button
            key={op.codigo}
            onClick={() => toggle(op.codigo)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              ativo
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {op.codigo} — {op.descricao}
          </button>
        );
      })}
    </div>
  );
}