'use client';
import { useState, useEffect, useCallback } from 'react';
import SegmentoSelect from '../components/SegmentoSelect';
import CnaeTags from '../components/CnaeTags';
import FiltrosForm from '../components/FiltrosForm';
import ProgressoPipeline from '../components/ProgressoPipeline';
import TabelaLeads from '../components/TabelaLeads';
import { getLeads, iniciarBusca, getStatusExecucao, iniciarEnriquecimento, iniciarPresencaDigital } from '../lib/api';
import { Empresa } from '../types/index';

export default function Home() {
  const [segmento, setSegmento]     = useState('Material de Construção');
  const [cnaes, setCnaes]           = useState(['4744099', '4744003', '4744001']);
  const [estados, setEstados]       = useState(['PB']);
  const [porte, setPorte]           = useState(['ME', 'EPP']);
  const [empresas, setEmpresas]     = useState<Empresa[]>([]);
  const [etapaAtual, setEtapaAtual] = useState(-1);
  const [execucaoId, setExecucaoId] = useState<number | null>(null);
  const [rodando, setRodando]       = useState(false);
  const [totalBanco, setTotalBanco] = useState(0);

  // carrega leads ao abrir
  useEffect(() => {
    getLeads().then(data => {
      setEmpresas(data);
      setTotalBanco(data.length);
    });
  }, []);

  // polling do status da execução
  useEffect(() => {
    if (!execucaoId || !rodando) return;
    const interval = setInterval(async () => {
      const status = await getStatusExecucao(execucaoId);
      if (status.status === 'concluido') {
        setRodando(false);
        setEtapaAtual(3);
        const leads = await getLeads();
        setEmpresas(leads);
        setTotalBanco(leads.length);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [execucaoId, rodando]);

  async function executar() {
    setRodando(true);
    setEtapaAtual(0);
    const exec = await iniciarBusca();
    setExecucaoId(exec.id);

    // simula progresso das etapas enquanto processa
    setTimeout(() => setEtapaAtual(1), 5000);
    setTimeout(() => setEtapaAtual(2), 10000);
  }

  function exportarCSV() {
    if (empresas.length === 0) return;
    const cols = ['CNPJ', 'Nome', 'Cidade', 'Estado', 'Regime', 'Porte', 'Google Nota', 'Google Avaliações', 'Score', 'Classificação'];
    const rows = empresas.map(e => [
      e.cnpj, e.nomeFantasia || e.razaoSocial || '',
      e.cidade || '', e.estado || '',
      e.regimeTributario || '', e.porte || '',
      e.googleNota ?? '', e.googleAvaliacoes ?? '',
      e.score ?? '', e.classificacao || ''
    ]);
    const csv = [cols, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'leads.csv'; a.click();
  }

  const quentes = empresas.filter(e => e.classificacao === 'Quente').length;
  const mornos  = empresas.filter(e => e.classificacao === 'Morno').length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Motor de Prospecção</h1>
          <p className="text-sm text-gray-400">Busca · Enriquecimento · Scoring</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{totalBanco} leads no banco</span>
          {quentes > 0 && <span className="text-green-600 font-medium">{quentes} quentes</span>}
        </div>
      </div>

      <div className="flex gap-6 p-6 max-w-screen-xl mx-auto">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Configuração</p>

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
              onChangeEstados={setEstados}
              onChangePorte={setPorte}
            />
          </div>

          <button
            onClick={executar}
            disabled={rodando || cnaes.length === 0}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {rodando ? 'Processando...' : 'Executar busca'}
          </button>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 space-y-4">
          {/* Pipeline */}
          {etapaAtual >= 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <ProgressoPipeline etapaAtual={etapaAtual} total={totalBanco} encontradas={empresas.length} />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: empresas.length, color: 'text-gray-800' },
              { label: 'Quentes', value: quentes, color: 'text-green-600' },
              { label: 'Mornos', value: mornos, color: 'text-yellow-600' },
              { label: 'Com Google', value: empresas.filter(e => e.googleNota).length, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">Leads qualificados</p>
              <button
                onClick={exportarCSV}
                className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Exportar CSV
              </button>
            </div>
            <div className="p-4">
              <TabelaLeads empresas={empresas} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}