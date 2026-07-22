'use client';
import { useState } from 'react';
import { getBuscas } from '../lib/api';
import { Busca } from '../types/index';

interface Props {
  onReaplicar: (filtros: any) => void;
}

export default function HistoricoBuscas({ onReaplicar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [buscas, setBuscas] = useState<Busca[]>([]);
  const [carregando, setCarregando] = useState(false);

async function abrir() {
    setAberto(true);
    setCarregando(true);
    const data = await getBuscas();
    setBuscas(Array.isArray(data) ? data : []);
    setCarregando(false);
  }

  function formatarData(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      <button
        onClick={abrir}
        className="w-full py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-widest"
        style={{ background: '#0D0D0D', color: '#9CA3AF', border: '1px solid #2A2A2A' }}
      >
        📜 Histórico de buscas
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setAberto(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="text-white font-bold">Histórico de buscas</p>
              <button onClick={() => setAberto(false)} className="text-xs" style={{ color: '#6B7280' }}>✕</button>
            </div>

            {carregando ? (
              <p className="text-xs" style={{ color: '#6B7280' }}>Carregando...</p>
            ) : buscas.length === 0 ? (
              <p className="text-xs" style={{ color: '#6B7280' }}>Nenhuma busca registrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {buscas.map(b => {
                  let filtros: any = {};
                  try { filtros = JSON.parse(b.filtros); } catch {}
                  return (
                    <div
                      key={b.id}
                      className="rounded-lg p-3"
                      style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{b.segmento}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                            {formatarData(b.createdAt)} · {b.totalLeads} leads
                          </p>
                          {filtros.estados?.length > 0 && (
                            <p className="text-xs mt-0.5" style={{ color: '#4B5563' }}>
                              {filtros.estados.join(', ')}
                              {filtros.municipios?.length > 0 ? ` · ${filtros.municipios.join(', ')}` : ' · todo o estado'}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => { onReaplicar(filtros); setAberto(false); }}
                          className="text-xs px-2 py-1 rounded font-bold flex-shrink-0"
                          style={{ background: '#E4002B', color: '#fff' }}
                        >
                          Reaplicar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}