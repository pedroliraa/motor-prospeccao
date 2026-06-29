'use client';
import { useState, useEffect } from 'react';
import { getCnaes } from '../lib/api';

interface Cnae {
  codigo: string;
  descricao: string;
}

interface Props {
  selecionados: string[];
  onChange: (cnaes: string[]) => void;
}

export default function CnaeTags({ selecionados, onChange }: Props) {
  const [todos, setTodos]     = useState<Cnae[]>([]);
  const [busca, setBusca]     = useState('');
  const [aberto, setAberto]   = useState(false);

  useEffect(() => {
    getCnaes().then(setTodos);
  }, []);

  const filtrados = busca.length >= 2
    ? todos.filter(c =>
        c.codigo.includes(busca) ||
        c.descricao.toLowerCase().includes(busca.toLowerCase())
      ).slice(0, 10)
    : [];

  function toggle(codigo: string) {
    selecionados.includes(codigo)
      ? onChange(selecionados.filter(c => c !== codigo))
      : onChange([...selecionados, codigo]);
  }

  return (
    <div className="space-y-2">
      {/* CNAEs selecionados */}
      <div className="flex flex-wrap gap-1.5">
        {selecionados.map(cod => {
          const cnae = todos.find(c => c.codigo === cod);
          return (
            <button
              key={cod}
              onClick={() => toggle(cod)}
              className="text-xs px-2 py-1 rounded-full transition-colors"
              style={{ background: '#E4002B', color: '#fff', border: '1px solid #E4002B' }}
            >
              {cod} ✕
            </button>
          );
        })}
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar CNAE por código ou descrição..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 200)}
          className="w-full text-xs rounded px-2 py-1.5 text-white placeholder-gray-600"
          style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
        />

        {/* Dropdown */}
        {aberto && filtrados.length > 0 && (
          <div
            className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
            style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', maxHeight: '200px', overflowY: 'auto' }}
          >
            {filtrados.map(c => (
              <button
                key={c.codigo}
                onMouseDown={() => toggle(c.codigo)}
                className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#2A2A2A]"
                style={{ color: selecionados.includes(c.codigo) ? '#E4002B' : '#F9FAFB' }}
              >
                <span style={{ color: '#E4002B' }}>{c.codigo}</span> — {c.descricao}
              </button>
            ))}
          </div>
        )}
      </div>

      {busca.length > 0 && busca.length < 2 && (
        <p className="text-xs" style={{ color: '#4B5563' }}>Digite pelo menos 2 caracteres</p>
      )}
    </div>
  );
}