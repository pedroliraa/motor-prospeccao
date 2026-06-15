'use client';
import { useState } from 'react';
import { Empresa } from '../types/index';
import { atualizarClassificacao } from '../lib/api';

interface Props {
  empresas: Empresa[];
  onClassificacaoChange?: (id: number, classificacao: string | null) => void;
}

function tempoDeAbertura(dataAbertura: string | null): string {
  if (!dataAbertura) return '—';
  const abertura = new Date(dataAbertura);
  const hoje = new Date();
  let anos = hoje.getFullYear() - abertura.getFullYear();
  let meses = hoje.getMonth() - abertura.getMonth();
  if (meses < 0) { anos--; meses += 12; }
  if (anos < 0) return '—';
  if (anos === 0) return `${meses} meses`;
  if (meses === 0) return `${anos} anos`;
  return `${anos} anos e ${meses} meses`;
}

function isFilial(cnpj: string): boolean {
  return cnpj.length >= 12 && cnpj.substring(8, 12) !== '0001';
}

function Badge({ classificacao }: { classificacao: string | null }) {
  if (!classificacao) return null;
  const map: Record<string, string> = {
    'Quente': 'bg-red-100 text-red-700',
    'Morno':  'bg-yellow-100 text-yellow-700',
    'Frio':   'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[classificacao] ?? 'bg-gray-100 text-gray-500'}`}>
      {classificacao}
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-400">—</span>;
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-gray-300';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-6">{score}</span>
    </div>
  );
}

function ClasseBotoes({ id, atual, onChange }: {
  id: number;
  atual: string | null;
  onChange: (id: number, c: string | null) => void;
}) {
  const [salvando, setSalvando] = useState(false);

  async function selecionar(c: string) {
    const nova = atual === c ? null : c;
    setSalvando(true);
    await atualizarClassificacao(id, nova);
    onChange(id, nova);
    setSalvando(false);
  }

  const botoes = [
    { label: '🔥', valor: 'Quente', ativo: 'bg-red-500 text-white', inativo: 'bg-gray-100 text-gray-400 hover:bg-red-50' },
    { label: '🌡', valor: 'Morno',  ativo: 'bg-yellow-400 text-white', inativo: 'bg-gray-100 text-gray-400 hover:bg-yellow-50' },
    { label: '❄️', valor: 'Frio',   ativo: 'bg-blue-400 text-white', inativo: 'bg-gray-100 text-gray-400 hover:bg-blue-50' },
  ];

  return (
    <div className={`flex gap-1 ${salvando ? 'opacity-50' : ''}`}>
      {botoes.map(b => (
        <button
          key={b.valor}
          onClick={() => selecionar(b.valor)}
          title={b.valor}
          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${atual === b.valor ? b.ativo : b.inativo}`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

type SortKey = 'nomeFantasia' | 'cidade' | 'googleNota' | 'tempoAbertura';

export default function TabelaLeads({ empresas, onClassificacaoChange }: Props) {
  const [busca, setBusca] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('googleNota');
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortAsc ? '↑' : '↓'}</span>;
  }

  const filtradas = empresas
    .filter(e => {
      if (!busca) return true;
      const q = busca.toLowerCase();
      return (
        (e.nomeFantasia ?? '').toLowerCase().includes(q) ||
        (e.razaoSocial ?? '').toLowerCase().includes(q) ||
        (e.cidade ?? '').toLowerCase().includes(q) ||
        (e.cnpj ?? '').includes(q) ||
        (e.telefone1 ?? '').includes(q) ||
        (e.email ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let va: any, vb: any;
      if (sortKey === 'googleNota') { va = a.googleNota ?? -1; vb = b.googleNota ?? -1; }
      else if (sortKey === 'nomeFantasia') { va = (a.nomeFantasia || a.razaoSocial || '').toLowerCase(); vb = (b.nomeFantasia || b.razaoSocial || '').toLowerCase(); }
      else if (sortKey === 'cidade')   { va = (a.cidade ?? '').toLowerCase(); vb = (b.cidade ?? '').toLowerCase(); }
      else if (sortKey === 'tempoAbertura') { va = a.dataAbertura ? new Date(a.dataAbertura).getTime() : 0; vb = b.dataAbertura ? new Date(b.dataAbertura).getTime() : 0; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

  if (empresas.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        Nenhum lead encontrado. Execute uma busca para começar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por nome, cidade, CNPJ, telefone ou e-mail..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-400">{filtradas.length} de {empresas.length} leads</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th onClick={() => toggleSort('nomeFantasia')} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4 cursor-pointer select-none hover:text-gray-600">
                Empresa <SortIcon k="nomeFantasia" />
              </th>
              <th onClick={() => toggleSort('cidade')} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4 cursor-pointer select-none hover:text-gray-600">
                Cidade <SortIcon k="cidade" />
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Contato</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Regime</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Faturamento</th>
              <th onClick={() => toggleSort('tempoAbertura')} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4 cursor-pointer select-none hover:text-gray-600">
                Tempo <SortIcon k="tempoAbertura" />
              </th>
              <th onClick={() => toggleSort('googleNota')} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4 cursor-pointer select-none hover:text-gray-600">
                Google <SortIcon k="googleNota" />
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3">Classificar</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(emp => (
              <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-800 truncate max-w-[180px]">
                      {emp.nomeFantasia || emp.razaoSocial || '—'}
                    </span>
                    {isFilial(emp.cnpj) && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                        filial
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{emp.cnae}</div>
                </td>
                <td className="py-3 pr-4 text-gray-600 whitespace-nowrap text-xs">
                  {emp.cidade}/{emp.estado}
                </td>
                <td className="py-3 pr-4">
                  {emp.telefone1 ? (
                    <a href={`tel:${emp.telefone1}`} className="text-xs text-blue-600 hover:underline block">
                      {emp.telefone1.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')}
                    </a>
                  ) : <span className="text-xs text-gray-400">—</span>}
                  {emp.email && (
                    <a href={`mailto:${emp.email}`} className="text-xs text-gray-400 hover:underline block truncate max-w-[140px]">
                      {emp.email.toLowerCase()}
                    </a>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs text-gray-600">
                  {emp.regimeTributario ?? '—'}
                </td>
                <td className="py-3 pr-4 text-xs text-gray-600">
                  {emp.faturamentoEstimado ?? '—'}
                </td>
                <td className="py-3 pr-4 text-xs text-gray-500 whitespace-nowrap">
                  {tempoDeAbertura(emp.dataAbertura)}
                </td>
                <td className="py-3 pr-4 text-xs text-gray-600 whitespace-nowrap">
                  {emp.googleNota ? `${emp.googleNota}★ (${emp.googleAvaliacoes})` : '—'}
                </td>
                <td className="py-3">
                  <ClasseBotoes
                    id={emp.id}
                    atual={emp.classificacao}
                    onChange={onClassificacaoChange ?? (() => {})}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}