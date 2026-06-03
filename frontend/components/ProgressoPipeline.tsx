'use client';

const ETAPAS = [
  { key: 'busca',    label: 'Busca CNAE'      },
  { key: 'enriq',   label: 'Enriquecimento'   },
  { key: 'digital', label: 'Presença Digital' },
  { key: 'scoring', label: 'Scoring IA'       },
];

interface Props {
  etapaAtual: number;
  total: number;
  encontradas: number;
}

export default function ProgressoPipeline({ etapaAtual, total, encontradas }: Props) {
  const concluido = etapaAtual >= ETAPAS.length;
  const pct = etapaAtual < 0 ? 0 : concluido ? 100 : Math.round(((etapaAtual + 1) / ETAPAS.length) * 100);
  const label = etapaAtual < 0 ? 'Aguardando execução'
    : concluido ? 'Concluído!'
    : (ETAPAS[etapaAtual]?.label + '...');

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-3">
        {ETAPAS.map((e, i) => {
          const done   = concluido || i < etapaAtual;
          const active = !concluido && i === etapaAtual;
          return (
            <div key={e.key} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                done   ? 'bg-green-100 text-green-700' :
                active ? 'bg-blue-100 text-blue-700'  :
                         'bg-gray-100 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${active ? 'font-medium text-gray-800' : done ? 'text-green-700' : 'text-gray-400'}`}>
                {e.label}
              </span>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <p className="text-xs text-gray-500">{encontradas} de {total} empresas processadas</p>
      )}
    </div>
  );
}