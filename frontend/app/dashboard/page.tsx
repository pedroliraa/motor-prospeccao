'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../lib/auth';
import { getDashboard } from '../../lib/api';
import { DashboardData } from '../../types/index';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CORES = ['#E4002B', '#CA8A04', '#2563EB', '#16A34A', '#9333EA', '#DB2777', '#6B7280'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filtroPorte, setFiltroPorte] = useState('');
  const [filtroRegime, setFiltroRegime] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [filtroCidade, filtroPorte, filtroRegime]);

  async function carregar() {
    setCarregando(true);
    const result = await getDashboard({
      cidade: filtroCidade || undefined,
      porte: filtroPorte || undefined,
      regimeTributario: filtroRegime || undefined,
    });
    setData(result);
    setCarregando(false);
  }

  function formatarData(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  return (
    <div className="min-h-screen w-full" style={{ background: '#0D0D0D', fontFamily: "'Sansation', Arial, sans-serif" }}>
      {/* NAVBAR */}
      <header className="bg-white border-b-2 border-[#E4002B] px-8 py-0 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-5">
            <img src="/impulse-logo.png" alt="Impulse B2B" style={{ height: '80px', width: 'auto' }} />
            <div className="w-px h-8 bg-[#E4002B]" />
            <div>
              <p className="text-black text-sm font-bold tracking-wide leading-tight">Dashboard</p>
              <p className="text-gray-400 text-xs leading-tight">Análise de leads</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
            style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
          >
            ← Voltar
          </button>
        </div>
      </header>

      <div className="p-6 pt-24 max-w-screen-xl mx-auto space-y-4">

        {/* FILTROS */}
        <div className="rounded-xl p-4 flex flex-wrap gap-3 items-center" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E4002B' }}>Filtros</p>

          <select
            value={filtroCidade}
            onChange={e => setFiltroCidade(e.target.value)}
            className="text-xs rounded px-2 py-1.5"
            style={{ background: '#0D0D0D', color: '#F9FAFB', border: '1px solid #2A2A2A' }}
          >
            <option value="">Todas as cidades</option>
            {data?.porCidade.map(c => (
              <option key={c.cidade} value={c.cidade}>{c.cidade}</option>
            ))}
          </select>

          <select
            value={filtroPorte}
            onChange={e => setFiltroPorte(e.target.value)}
            className="text-xs rounded px-2 py-1.5"
            style={{ background: '#0D0D0D', color: '#F9FAFB', border: '1px solid #2A2A2A' }}
          >
            <option value="">Todos os portes</option>
            {data?.porPorte.map(p => (
              <option key={p.porte} value={p.porte}>{p.porte}</option>
            ))}
          </select>

          <select
            value={filtroRegime}
            onChange={e => setFiltroRegime(e.target.value)}
            className="text-xs rounded px-2 py-1.5"
            style={{ background: '#0D0D0D', color: '#F9FAFB', border: '1px solid #2A2A2A' }}
          >
            <option value="">Todos os regimes</option>
            {data?.porRegime.map(r => (
              <option key={r.regime} value={r.regime}>{r.regime}</option>
            ))}
          </select>

          {(filtroCidade || filtroPorte || filtroRegime) && (
            <button
              onClick={() => { setFiltroCidade(''); setFiltroPorte(''); setFiltroRegime(''); }}
              className="text-xs px-2 py-1.5 rounded font-bold"
              style={{ background: '#2A2A2A', color: '#9CA3AF' }}
            >
              Limpar filtros ✕
            </button>
          )}
        </div>

        {carregando || !data ? (
          <p className="text-sm text-center py-16" style={{ color: '#6B7280' }}>Carregando dashboard...</p>
        ) : (
          <>
            {/* CARDS DE RESUMO */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total de Leads', value: data.total, cor: '#6B7280', bg: '#F3F4F6' },
                { label: 'Com Telefone', value: `${Math.round((data.qualidade.comTelefone / data.total) * 100) || 0}%`, cor: '#FFFFFF', bg: '#2563EB' },
                { label: 'WhatsApp Ativo', value: `${Math.round((data.qualidade.comWhatsapp / data.total) * 100) || 0}%`, cor: '#FFFFFF', bg: '#25D366' },
                { label: 'Com Google', value: `${Math.round((data.qualidade.comGoogle / data.total) * 100) || 0}%`, cor: '#FFFFFF', bg: '#CA8A04' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4" style={{ background: s.bg }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: s.cor, opacity: 0.8 }}>{s.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: s.cor }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* LEADS POR CIDADE */}
              <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E4002B' }}>Leads por Cidade</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.porCidade}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis dataKey="cidade" tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #2A2A2A', fontSize: 12 }} />
                    <Bar dataKey="total" fill="#E4002B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* DISTRIBUIÇÃO POR PORTE */}
              <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E4002B' }}>Distribuição por Porte</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={data.porPorte} dataKey="total" nameKey="porte" cx="50%" cy="50%" outerRadius={80} label={{ fill: '#9CA3AF', fontSize: 11 }}>
                      {data.porPorte.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #2A2A2A', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* DISTRIBUIÇÃO POR REGIME */}
              <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E4002B' }}>Regime Tributário</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.porRegime} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <YAxis dataKey="regime" type="category" tick={{ fill: '#6B7280', fontSize: 10 }} width={110} />
                    <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #2A2A2A', fontSize: 12 }} />
                    <Bar dataKey="total" fill="#CA8A04" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* FUNIL DE CLASSIFICAÇÃO */}
              <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E4002B' }}>Classificação dos Leads</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { nome: 'Quente', total: data.classificacao.quentes },
                        { nome: 'Morno', total: data.classificacao.mornos },
                        { nome: 'Frio', total: data.classificacao.frios },
                        { nome: 'Sem classificação', total: data.classificacao.semClassificacao },
                      ]}
                      dataKey="total"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={{ fill: '#9CA3AF', fontSize: 11 }}
                    >
                      <Cell fill="#E4002B" />
                      <Cell fill="#CA8A04" />
                      <Cell fill="#2563EB" />
                      <Cell fill="#374151" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #2A2A2A', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* EVOLUÇÃO DE BUSCAS */}
            <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E4002B' }}>Evolução de Buscas</p>
              {data.evolucaoBuscas.length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: '#4B5563' }}>Nenhuma busca registrada ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.evolucaoBuscas.map(b => ({ ...b, dataFormatada: formatarData(b.createdAt) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis dataKey="dataFormatada" tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #2A2A2A', fontSize: 12 }} />
                    <Line type="monotone" dataKey="totalLeads" stroke="#E4002B" strokeWidth={2} dot={{ fill: '#E4002B' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}