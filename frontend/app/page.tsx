'use client';
import { useState, useEffect } from 'react';
import { getToken, getUsuario, logout } from '../lib/auth';
import CnaeTags from '../components/CnaeTags';
import FiltrosForm from '../components/FiltrosForm';
import ProgressoPipeline from '../components/ProgressoPipeline';
import { getWhatsAppStatus, verificarTodosWhatsApp, conectarWhatsApp } from '../lib/api';
import TabelaLeads from '../components/TabelaLeads';
import { getLeads, getEtiquetas, iniciarBusca, getStatusExecucao, iniciarEnriquecimento, iniciarPresencaDigital, exportarExcel } from '../lib/api';
import { Empresa } from '../types/index';
import GerenciadorEtiquetas from '../components/GerenciadorEtiquetas';
import { Etiqueta } from '../types/index';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const FILTROS_FIXOS = ['Todos', 'Quente', 'Morno', 'Frio', 'Sem classificação'] as const;
type FiltroClasse = string;


export default function Home() {
  const [cnaes, setCnaes] = useState<string[]>([]);
  const [estados, setEstados] = useState(['PB']);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [porte, setPorte] = useState(['ME', 'EPP']);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [etapaAtual, setEtapaAtual] = useState(-1);
  const [execucaoId, setExecucaoId] = useState<number | null>(null);
  const [rodando, setRodando] = useState(false);
  const [totalBanco, setTotalBanco] = useState(0);
  const [filtroClasse, setFiltroClasse] = useState<FiltroClasse>('Todos');
  const [somentePrimario, setSomentePrimario] = useState(false);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [somenteTelefone, setSomenteTelefone] = useState(false);
  const [wppStatus, setWppStatus] = useState<'desconectado' | 'aguardando_qr' | 'conectado'>('desconectado');
  const [wppQR, setWppQR] = useState<string | null>(null);
  const [wppModal, setWppModal] = useState(false);
  const [verificandoWpp, setVerificandoWpp] = useState(false);
  //const [wppContagem, setWppContagem] = useState<{ total: number, verificados: number } | null>(null);
  const [wppMenuAberto, setWppMenuAberto] = useState(false);
  const [wppMenuPos, setWppMenuPos] = useState({ x: 0, y: 0 });

  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    getLeads().then(data => {
      const ordenados = [...data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setEmpresas(ordenados);
      setTotalBanco(data.length);
      getEtiquetas().then(setEtiquetas);
    });
  }, []);

  useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const data = await getWhatsAppStatus();
      setWppStatus(data.status);
      setWppQR(data.qrCode);
      if (data.status === 'conectado') setWppModal(false);
    } catch {
      // backend temporariamente indisponível, ignora
    }
  }, 3000);
  return () => clearInterval(interval);
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

  async function validarWhatsApp() {
    setVerificandoWpp(true);
    //setWppContagem({ total: empresas.length, verificados: 0 });
    await verificarTodosWhatsApp();
    await recarregarLeads();
    //setWppContagem(null);
    setVerificandoWpp(false);
  }

  async function executar() {
    setRodando(true);
    setEtapaAtual(0);
    const exec = await iniciarBusca(somentePrimario, cnaes, estados, municipios, porte);
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

    /*setEtapaAtual(3);
    await fetch(`${API_URL}/api/scoring?limite=10`, { method: 'POST' });
    await new Promise(r => setTimeout(r, 5000));*/

    setEtapaAtual(3);
    await recarregarLeads();
    setRodando(false);
  }

  const quentes = empresas.filter(e => e.classificacao === 'Quente').length;
  const mornos = empresas.filter(e => e.classificacao === 'Morno').length;

  const empresasFiltradas = (
    filtroClasse === 'Todos' ? empresas :
      filtroClasse === 'Sem classificação' ? empresas.filter(e => !e.classificacao) :
        empresas.filter(e => e.classificacao === filtroClasse)
  ).filter(e => !somenteTelefone || (e.telefone1 && e.telefone1.trim() !== ''));

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
          {getUsuario()?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
              style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              Admin
            </button>
          )}
          <button
            onClick={logout}
            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
            style={{ background: '#F3F4F6', color: '#E4002B', border: '1px solid #E4002B' }}
          >
            Sair
          </button>
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
              <label className="text-xs text-gray-500 mb-1 block">CNAEs</label>
              <CnaeTags selecionados={cnaes} onChange={setCnaes} />
            </div>
            <FiltrosForm
              estados={estados}
              porte={porte}
              municipios={municipios}
              somentePrimario={somentePrimario}
              somenteTelefone={somenteTelefone}
              onChangeEstados={setEstados}
              onChangePorte={setPorte}
              onChangeMunicipios={setMunicipios}
              onChangeSomentePrimario={setSomentePrimario}
              onChangeSomenteTelefone={setSomenteTelefone}
            />
          </div>

          <button
            onClick={executar}
            disabled={rodando || cnaes.length === 0 || estados.length === 0}
            className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all uppercase tracking-widest disabled:opacity-40"
            style={{ background: rodando ? '#555' : '#E4002B' }}
          >
            {rodando ? 'Processando...' : 'Executar busca'}
          </button>
          {(cnaes.length === 0 || estados.length === 0) && !rodando && (
            <p className="text-xs text-center" style={{ color: '#E4002B' }}>
              {cnaes.length === 0 && estados.length === 0
                ? 'Selecione pelo menos um CNAE e um estado'
                : cnaes.length === 0
                  ? 'Selecione pelo menos um CNAE'
                  : 'Selecione pelo menos um estado'}
            </p>
          )}

          <GerenciadorEtiquetas etiquetas={etiquetas} onUpdate={recarregarEtiquetas} />
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 space-y-4" style={{ minWidth: 0 }}>
          {etapaAtual >= 0 && (
            <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
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
              {/* Modal QR Code */}
              {wppModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.8)' }}
                  onClick={() => setWppModal(false)}
                >
                  <div
                    className="rounded-2xl p-8 text-center"
                    style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <p className="text-white font-bold mb-2">Conectar WhatsApp</p>
                    <p className="text-xs text-gray-400 mb-4">Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo</p>
                    {wppQR ? (
                      <img src={wppQR} alt="QR Code" className="w-64 h-64 mx-auto rounded-lg" />
                    ) : (
                      <div className="w-64 h-64 mx-auto flex items-center justify-center" style={{ background: '#0D0D0D', borderRadius: 8 }}>
                        <p className="text-xs text-gray-500">Gerando QR Code...</p>
                      </div>
                    )}
                    <button
                      onClick={() => setWppModal(false)}
                      className="mt-4 text-xs px-4 py-2 rounded-lg"
                      style={{ background: '#2A2A2A', color: '#9CA3AF' }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

              {/* Menu contexto WhatsApp */}
              {wppMenuAberto && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setWppMenuAberto(false)}
                >
                  <div
                    className="absolute rounded-lg overflow-hidden"
                    style={{
                      top: wppMenuPos.y,
                      left: wppMenuPos.x,
                      background: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={async () => {
                        setWppMenuAberto(false);
                        await fetch(`${API_URL}/api/whatsapp/desconectar`, { method: 'POST' });
                        setWppStatus('desconectado');
                      }}
                      className="w-full text-left text-xs px-4 py-2.5 font-bold hover:bg-[#2A2A2A] transition-colors"
                      style={{ color: '#fff', background: '#E4002B', borderBottom: '1px solid #2A2A2A' }}
                    >
                      Desconectar WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* Botão WhatsApp */}
              <div className="relative">
                <button
                  onClick={async () => {
                    if (wppStatus === 'conectado') {
                      validarWhatsApp();
                    } else {
                      await conectarWhatsApp();
                      setWppModal(true);
                    }
                  }}
                  onContextMenu={e => {
                    if (wppStatus === 'conectado') {
                      e.preventDefault();
                      setWppMenuPos({ x: e.clientX, y: e.clientY });
                      setWppMenuAberto(true);
                    }
                  }}
                  disabled={verificandoWpp || (wppStatus === 'conectado' && totalBanco === 0)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40"
                  style={{
                    background: wppStatus === 'conectado' ? '#25D366' : '#2A2A2A',
                    color: '#fff',
                    border: wppStatus === 'conectado' ? '1px solid #25D366' : '1px solid #3A3A3A',
                  }}
                >
                  {verificandoWpp ? `Verificando ${empresas.length} leads...` :
                    wppStatus === 'conectado' ? '✓ Validar WhatsApp' :
                      wppStatus === 'aguardando_qr' ? '📱 Escanear QR' :
                        '📱 Conectar WhatsApp'}
                </button>
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
