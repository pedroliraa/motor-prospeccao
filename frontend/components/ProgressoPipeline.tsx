'use client';

const ETAPAS = [
  { key: 'busca', label: 'Busca CNAE' },
  { key: 'enriq', label: 'Enriquecimento' },
  { key: 'digital', label: 'Presença Digital' },
  { key: 'concluido', label: 'Concluído' },
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
      <div className="flex justify-between text-xs">
        <span style={{ color: concluido ? '#E4002B' : '#9CA3AF' }}>{label}</span>
        <span style={{ color: '#E4002B' }} className="font-bold">{pct}%</span>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#2A2A2A' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#E4002B' }}
        />
      </div>

      {/* Etapas */}
      <div className="flex gap-4 flex-wrap">
        {ETAPAS.map((e, i) => {
          const done = concluido || i < etapaAtual;
          const active = !concluido && i === etapaAtual;
          return (
            <div key={e.key} className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: done ? '#1A0008' : active ? '#E4002B' : '#2A2A2A',
                  color: done ? '#E4002B' : active ? '#FFFFFF' : '#4B5563',
                  border: done ? '1px solid #E4002B' : active ? 'none' : '1px solid #3A3A3A',
                }}
              >
                {done ? '✓' : active ? i + 1 : i + 1}
              </div>
              <span
                className="text-xs"
                style={{
                  color: done ? '#E4002B' : active ? '#F9FAFB' : '#4B5563',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {e.label}
              </span>
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <p className="text-xs" style={{ color: '#4B5563' }}>
          {encontradas} de {total} empresas processadas
        </p>
      )}
    </div>
  );
}