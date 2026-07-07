'use client';
import { useState } from 'react';
import { getMunicipios } from '../lib/api';

interface Props {
  estados: string[];
  porte: string[];
  municipios: string[];
  somentePrimario: boolean;
  somenteTelefone: boolean;
  onChangeEstados: (v: string[]) => void;
  onChangePorte: (v: string[]) => void;
  onChangeMunicipios: (v: string[]) => void;
  onChangeSomentePrimario: (v: boolean) => void;
  onChangeSomenteTelefone: (v: boolean) => void;
}

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];
const PORTES = ['MEI', 'ME', 'EPP', 'Grande'];

export default function FiltrosForm({
  estados, porte, municipios, somentePrimario, somenteTelefone,
  onChangeEstados, onChangePorte, onChangeMunicipios,
  onChangeSomentePrimario, onChangeSomenteTelefone
}: Props) {
  const [municipioInput, setMunicipioInput] = useState('');
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [aberto, setAberto] = useState(false);

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

  function adicionarMunicipio() {
    const m = municipioInput.trim().toUpperCase();
    if (!m || municipios.includes(m)) return;
    onChangeMunicipios([...municipios, m]);
    setMunicipioInput('');
    setSugestoes([]);
    setAberto(false);
  }

  function removerMunicipio(m: string) {
    onChangeMunicipios(municipios.filter(x => x !== m));
  }

  async function buscarSugestoes(valor: string) {
    setMunicipioInput(valor);
    if (valor.length >= 2) {
      const data = await getMunicipios(valor);
      setSugestoes(data);
      setAberto(true);
    } else {
      setSugestoes([]);
      setAberto(false);
    }
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
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Município</p>
        {estados.length === 0 ? (
          <p className="text-xs" style={{ color: '#4B5563' }}>Selecione um estado primeiro</p>
        ) : (
          <>
            <div className="relative">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={municipioInput}
                  onChange={e => buscarSugestoes(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && adicionarMunicipio()}
                  onBlur={() => setTimeout(() => setAberto(false), 200)}
                  placeholder="Ex: Campina Grande"
                  className="flex-1 text-xs rounded px-2 py-1.5 text-white placeholder-gray-600 focus:outline-none"
                  style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
                />
                <button
                  onClick={adicionarMunicipio}
                  className="text-xs px-3 py-1 rounded font-bold"
                  style={{ background: '#E4002B', color: '#fff' }}
                >
                  +
                </button>
              </div>
              {aberto && sugestoes.length > 0 && (
                <div className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', maxHeight: '160px', overflowY: 'auto' }}>
                  {sugestoes.map(s => (
                    <button
                      key={s}
                      onMouseDown={() => {
                        if (!municipios.includes(s)) {
                          onChangeMunicipios([...municipios, s]);
                        }
                        setMunicipioInput('');
                        setSugestoes([]);
                        setAberto(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#2A2A2A]"
                      style={{ color: '#F9FAFB' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {municipios.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {municipios.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: '#1A0008', color: '#E4002B', border: '1px solid #E4002B' }}>
                    {m}
                    <button onClick={() => removerMunicipio(m)} className="hover:text-white">✕</button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
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
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Telefone</p>
        <button
          onClick={() => onChangeSomenteTelefone(!somenteTelefone)}
          className="text-xs px-3 py-1.5 rounded w-full font-medium transition-colors text-left"
          style={{
            background: somenteTelefone ? '#E4002B' : '#0D0D0D',
            color: somenteTelefone ? '#fff' : '#6B7280',
            border: somenteTelefone ? '1px solid #E4002B' : '1px solid #2A2A2A',
          }}
        >
          {somenteTelefone ? '✓ Só com telefone' : 'Todos (com e sem telefone)'}
        </button>
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