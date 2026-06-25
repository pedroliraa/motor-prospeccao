'use client';
import { useState } from 'react';
import { Etiqueta } from '../types/index';
import { criarEtiqueta, deletarEtiqueta } from '../lib/api';

const CORES = [
  '#E4002B', '#CA8A04', '#2563EB', '#16A34A',
  '#7C3AED', '#DB2777', '#0891B2', '#EA580C',
];

interface Props {
  etiquetas: Etiqueta[];
  onUpdate: () => void;
}

export default function GerenciadorEtiquetas({ etiquetas, onUpdate }: Props) {
  const [aberto, setAberto]   = useState(false);
  const [nome, setNome]       = useState('');
  const [cor, setCor]         = useState('#E4002B');
  const [salvando, setSalvando] = useState(false);

  async function criar() {
    if (!nome.trim()) return;
    setSalvando(true);
    await criarEtiqueta(nome.trim(), cor);
    setNome('');
    onUpdate();
    setSalvando(false);
  }

  async function deletar(id: number) {
    await deletarEtiqueta(id);
    onUpdate();
  }

  return (
    <div>
      <button
        onClick={() => setAberto(a => !a)}
        className="text-xs w-full py-1.5 rounded font-bold transition-all uppercase tracking-wide"
        style={{ background: '#2A2A2A', color: '#6B7280', border: '1px solid #3A3A3A' }}
      >
        {aberto ? '✕ Fechar' : '⚙ Gerenciar etiquetas'}
      </button>

      {aberto && (
        <div className="mt-2 space-y-2">
          {/* Criar nova */}
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="Nova etiqueta..."
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && criar()}
              className="flex-1 text-xs rounded px-2 py-1 text-white placeholder-gray-600"
              style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
            />
            <button
              onClick={criar}
              disabled={salvando || !nome.trim()}
              className="text-xs px-3 py-1 rounded font-bold disabled:opacity-40"
              style={{ background: '#E4002B', color: '#fff' }}
            >
              +
            </button>
          </div>

          {/* Cores */}
          <div className="flex gap-1 flex-wrap">
            {CORES.map(c => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className="w-5 h-5 rounded-full transition-all"
                style={{
                  background: c,
                  border: cor === c ? '2px solid #fff' : '2px solid transparent',
                  transform: cor === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Lista */}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {etiquetas.filter(e => !['Quente','Morno','Frio'].includes(e.nome)).map(e => (
              <div key={e.id} className="flex items-center justify-between px-2 py-1 rounded" style={{ background: '#0D0D0D' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: e.cor }} />
                  <span className="text-xs text-white">{e.nome}</span>
                </div>
                <button onClick={() => deletar(e.id)} className="text-xs text-gray-600 hover:text-red-500">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}