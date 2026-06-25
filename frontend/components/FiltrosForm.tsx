'use client';

interface Props {
  estados: string[];
  porte: string[];
  somentePrimario: boolean;
  onChangeEstados: (v: string[]) => void;
  onChangePorte: (v: string[]) => void;
  onChangeSomentePrimario: (v: boolean) => void;
}

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];
const PORTES = ['ME', 'EPP', 'Grande'];

export default function FiltrosForm({ estados, porte, somentePrimario, onChangeEstados, onChangePorte, onChangeSomentePrimario }: Props) {
  function toggleEstado(uf: string) {
    estados.includes(uf)
      ? onChangeEstados(estados.filter(e => e !== uf))
      : onChangeEstados([...estados, uf]);
  }
  function togglePorte(p: string) {
    porte.includes(p)
      ? onChangePorte(porte.filter(x => x !== p))
      : onChangePorte([...porte, p]);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Estado(s)</p>
        <div className="flex flex-wrap gap-1.5">
          {ESTADOS.map(uf => {
            const ativo = estados.includes(uf);
            return (
              <button key={uf} onClick={() => toggleEstado(uf)}
                className="text-xs px-2 py-1 rounded transition-colors font-medium"
                style={{
                  background: ativo ? '#E4002B' : '#0D0D0D',
                  color: ativo ? '#FFFFFF' : '#6B7280',
                  border: ativo ? '1px solid #E4002B' : '1px solid #2A2A2A',
                }}>
                {uf}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">CNAE</p>
        <button
          onClick={() => onChangeSomentePrimario(!somentePrimario)}
          className="text-xs px-3 py-1.5 rounded w-full font-medium transition-colors text-left"
          style={{
            background: somentePrimario ? '#E4002B' : '#0D0D0D',
            color: somentePrimario ? '#fff' : '#6B7280',
            border: somentePrimario ? '1px solid #E4002B' : '1px solid #2A2A2A',
          }}
        >
          {somentePrimario ? '✓ Só CNAE primário' : 'Todos os CNAEs (primário + secundário)'}
        </button>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Município</p>
        <input
          type="text"
          placeholder="Ex: Campina Grande"
          className="w-full text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E4002B] text-white placeholder-gray-600"
          style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
        />
      </div>

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Porte</p>
        <div className="flex gap-2">
          {PORTES.map(p => {
            const ativo = porte.includes(p);
            return (
              <button key={p} onClick={() => togglePorte(p)}
                className="text-xs px-3 py-1 rounded transition-colors font-medium"
                style={{
                  background: ativo ? '#E4002B' : '#0D0D0D',
                  color: ativo ? '#FFFFFF' : '#6B7280',
                  border: ativo ? '1px solid #E4002B' : '1px solid #2A2A2A',
                }}>
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}