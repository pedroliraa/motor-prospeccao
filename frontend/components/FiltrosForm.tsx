'use client';

interface Props {
  estados: string[];
  porte: string[];
  onChangeEstados: (v: string[]) => void;
  onChangePorte: (v: string[]) => void;
}

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];
const PORTES = ['ME', 'EPP', 'Grande'];

export default function FiltrosForm({ estados, porte, onChangeEstados, onChangePorte }: Props) {
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
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Estado(s)</p>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map(uf => (
            <button key={uf} onClick={() => toggleEstado(uf)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${estados.includes(uf)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}>
              {uf}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Município</p>
        <input
          type="text"
          placeholder="Ex: Campina Grande"
          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Porte</p>
        <div className="flex gap-2">
          {PORTES.map(p => (
            <button key={p} onClick={() => togglePorte(p)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${porte.includes(p)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}