'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import SegmentoSelect from '../components/SegmentoSelect';
import CnaeTags from '../components/CnaeTags';
import FiltrosForm from '../components/FiltrosForm';
import ProgressoPipeline from '../components/ProgressoPipeline';
import TabelaLeads from '../components/TabelaLeads';
import { getLeads, getEtiquetas, iniciarBusca, getStatusExecucao, iniciarEnriquecimento, iniciarPresencaDigital, exportarExcel } from '../lib/api';
import { Empresa } from '../types/index';
import GerenciadorEtiquetas from '../components/GerenciadorEtiquetas';
import { Etiqueta } from '../types/index';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const FILTROS_FIXOS = ['Todos', 'Quente', 'Morno', 'Frio', 'Sem classificação'] as const;
type FiltroClasse = string;


export default function Home() {
  const [segmento, setSegmento] = useState('Material de Construção');
  const [cnaes, setCnaes] = useState(['4744099', '4744003', '4744001']);
  const [estados, setEstados] = useState(['PB']);
  const [porte, setPorte] = useState(['ME', 'EPP']);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [etapaAtual, setEtapaAtual] = useState(-1);
  const [execucaoId, setExecucaoId] = useState<number | null>(null);
  const [rodando, setRodando] = useState(false);
  const [totalBanco, setTotalBanco] = useState(0);
  const [filtroClasse, setFiltroClasse] = useState<FiltroClasse>('Todos');
  const [somentePrimario, setSomentePrimario] = useState(false);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);

  useEffect(() => {
    getLeads().then(data => {
      const ordenados = [...data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setEmpresas(ordenados);
      setTotalBanco(data.length);
      getEtiquetas().then(setEtiquetas);
    });
  }, []);

  async function recarregarLeads() {
    const data = await getLeads();
    const ordenados = [...data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    setEmpresas(ordenados);
    setTotalBanco(data.length);
  }

  async function recarregarEtiquetas() {
    const data = await getEtiquetas();
    setEtiquetas(data);
  }

  function onClassificacaoChange(id: number, classificacao: string | null) {
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, classificacao } : e));
  }

  async function executar() {
    setRodando(true);
    setEtapaAtual(0);
    const exec = await iniciarBusca(somentePrimario);
    setExecucaoId(exec.id);

    await new Promise<void>(resolve => {
      const interval = setInterval(async () => {
        const status = await getStatusExecucao(exec.id);
        if (status.status === 'concluido') { clearInterval(interval); resolve(); }
      }, 3000);
    });

    setEtapaAtual(1);
    await iniciarEnriquecimento();
    await new Promise(r => setTimeout(r, 5000));

    setEtapaAtual(2);
    await iniciarPresencaDigital();
    await new Promise(r => setTimeout(r, 5000));

    setEtapaAtual(3);
    await fetch(`${API_URL}/api/scoring?limite=10`, { method: 'POST' });
    await new Promise(r => setTimeout(r, 5000));

    setEtapaAtual(4);
    await recarregarLeads();
    setRodando(false);
  }

  const quentes = empresas.filter(e => e.classificacao === 'Quente').length;
  const mornos = empresas.filter(e => e.classificacao === 'Morno').length;

  const empresasFiltradas =
    filtroClasse === 'Todos' ? empresas :
      filtroClasse === 'Sem classificação' ? empresas.filter(e => !e.classificacao) :
        empresas.filter(e => e.classificacao === filtroClasse);

  const todosOsFiltros = [
    ...FILTROS_FIXOS,
    ...etiquetas.filter(e => !['Quente', 'Morno', 'Frio'].includes(e.nome)).map(e => e.nome)
  ];

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: '#0D0D0D',
        fontFamily: "'Sansation', Arial, sans-serif",
        minHeight: '100vh',
      }}
    >
      {/* ── NAVBAR ── */}
      <header className="bg-white border-b-2 border-[#E4002B] px-8 py-0 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-5">
            <img src="/impulse-logo.png" alt="Impulse B2B" style={{ height: '80px', width: 'auto' }} />
            <div className="w-px h-8 bg-[#E4002B]" />
            <div>
              <p className="text-black text-sm font-bold tracking-wide leading-tight">Motor de Prospecção</p>
              <p className="text-gray-400 text-xs leading-tight">Busca · Enriquecimento · Scoring</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── CORPO ── */}
      <div className="flex gap-6 p-6 pt-20 max-w-screen-xl mx-auto">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4" style={{
          height: 'calc(100vh - 88px)',
          overflowY: 'auto',
          position: 'sticky',
          top: '80px',
        }}>
          <div className="rounded-xl p-4 space-y-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E4002B' }}>
              Configuração
            </p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Segmento</label>
              <SegmentoSelect value={segmento} onChange={v => { setSegmento(v); setCnaes([]); }} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">CNAEs</label>
              <CnaeTags segmento={segmento} selecionados={cnaes} onChange={setCnaes} />
            </div>
            <FiltrosForm
              estados={estados}
              porte={porte}
              somentePrimario={somentePrimario}
              onChangeEstados={setEstados}
              onChangePorte={setPorte}
              onChangeSomentePrimario={setSomentePrimario}
            />
          </div>

          <button
            onClick={executar}
            disabled={rodando || cnaes.length === 0}
            className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all uppercase tracking-widest disabled:opacity-40"
            style={{ background: rodando ? '#555' : '#E4002B' }}
          >
            {rodando ? 'Processando...' : 'Executar busca'}
          </button>

          <GerenciadorEtiquetas etiquetas={etiquetas} onUpdate={recarregarEtiquetas} />
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 space-y-4" style={{ minWidth: 0 }}>
          {etapaAtual >= 0 && (
            <div className="rounded-xl" style={{
              background: '#1A1A1A',
              border: '1px solid #2A2A2A',
              overflow: 'hidden'
            }}>
              <ProgressoPipeline etapaAtual={etapaAtual} total={totalBanco} encontradas={empresas.length} />
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: empresas.length, cor: '#6B7280', bg: '#F3F4F6', border: '#2A2A2A' },
              { label: 'Quentes 🔥', value: quentes, cor: '#FFFFFF', bg: '#E4002B', border: '#E4002B' },
              { label: 'Mornos 🌡', value: mornos, cor: '#FFFFFF', bg: '#CA8A04', border: '#CA8A04' },
              { label: 'Com Google', value: empresas.filter(e => e.googleNota).length, cor: '#6B7280', bg: '#F3F4F6', border: '#2A2A2A' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: s.cor, opacity: 0.7 }}>{s.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: s.cor }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-2" style={{ borderBottom: '1px solid #2A2A2A' }}>
              <div className="flex gap-2 flex-wrap">
                {todosOsFiltros.map(f => {
                  const ativo = filtroClasse === f;
                  const bgAtivo =
                    f === 'Quente' ? '#E4002B' :
                      f === 'Morno' ? '#CA8A04' :
                        f === 'Frio' ? '#2563EB' :
                          f === 'Sem classificação' ? '#374151' :
                            etiquetas.find(e => e.nome === f)?.cor ?? '#6B7280';
                  const txtAtivo = f === 'Todos' ? '#000000' : '#FFFFFF';
                  const count =
                    f === 'Todos' ? null :
                      f === 'Sem classificação' ? empresas.filter(e => !e.classificacao).length :
                        empresas.filter(e => e.classificacao === f).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setFiltroClasse(f)}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wide"
                      style={{
                        background: ativo ? bgAtivo : '#2A2A2A',
                        color: ativo ? txtAtivo : '#6B7280',
                        border: ativo ? `1px solid ${bgAtivo}` : '1px solid #3A3A3A',
                      }}
                    >
                      {f}{count !== null ? ` (${count})` : ''}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={exportarExcel}
                className="text-xs px-4 py-1.5 text-white rounded-lg font-bold transition-all flex-shrink-0 uppercase tracking-wide"
                style={{ background: '#E4002B', border: '1px solid #E4002B' }}
              >
                Exportar Excel
              </button>
            </div>
            <div className="p-4">
              <TabelaLeads
                empresas={empresasFiltradas}
                etiquetas={etiquetas}
                onClassificacaoChange={onClassificacaoChange}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
