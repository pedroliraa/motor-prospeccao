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
  if (anos === 0) return `${meses} mês${meses !== 1 ? 'es' : ''}`;
  if (meses === 0) return `${anos} ano${anos !== 1 ? 's' : ''}`;
  return `${anos}a ${meses}m`;
}

function isFilial(cnpj: string): boolean {
  return cnpj.length >= 12 && cnpj.substring(8, 12) !== '0001';
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
    { label: '🔥', valor: 'Quente', bg: '#E4002B' },
    { label: '🌡', valor: 'Morno',  bg: '#CA8A04' },
    { label: '❄️', valor: 'Frio',   bg: '#2563EB' },
  ];

  return (
    <div className={`flex gap-1 ${salvando ? 'opacity-40' : ''}`}>
      {botoes.map(b => {
        const ativo = atual === b.valor;
        return (
          <button
            key={b.valor}
            onClick={() => selecionar(b.valor)}
            title={b.valor}
            className="text-xs px-2 py-0.5 rounded-full transition-all"
            style={{
              background: ativo ? b.bg : '#2A2A2A',
              color:      ativo ? '#fff' : '#6B7280',
              border:     ativo ? `1px solid ${b.bg}` : '1px solid #3A3A3A',
              transform:  ativo ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {b.label}
          </button>
        );
      })}
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
    if (sortKey !== k) return <span style={{ color: '#3A3A3A' }} className="ml-1">↕</span>;
    return <span style={{ color: '#E4002B' }} className="ml-1">{sortAsc ? '↑' : '↓'}</span>;
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
      if (sortKey === 'googleNota')        { va = a.googleNota ?? -1;  vb = b.googleNota ?? -1; }
      else if (sortKey === 'nomeFantasia') { va = (a.nomeFantasia || a.razaoSocial || '').toLowerCase(); vb = (b.nomeFantasia || b.razaoSocial || '').toLowerCase(); }
      else if (sortKey === 'cidade')       { va = (a.cidade ?? '').toLowerCase(); vb = (b.cidade ?? '').toLowerCase(); }
      else if (sortKey === 'tempoAbertura'){ va = a.dataAbertura ? new Date(a.dataAbertura).getTime() : 0; vb = b.dataAbertura ? new Date(b.dataAbertura).getTime() : 0; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

  if (empresas.length === 0) {
    return (
      <div className="text-center py-16 text-sm" style={{ color: '#4B5563' }}>
        Nenhum lead encontrado. Execute uma busca para começar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Buscar por nome, cidade, CNPJ, telefone ou e-mail..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full text-sm rounded-lg px-3 py-2 text-white placeholder-gray-600 transition-all"
        style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', outline: 'none' }}
        onFocus={e => (e.target.style.borderColor = '#E4002B')}
        onBlur={e  => (e.target.style.borderColor = '#2A2A2A')}
      />
      <p className="text-xs" style={{ color: '#4B5563' }}>
        {filtradas.length} de {empresas.length} leads
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              <th onClick={() => toggleSort('nomeFantasia')} className="text-left pb-3 pr-4 text-xs font-bold uppercase tracking-widest cursor-pointer select-none hover:text-[#E4002B]" style={{ color: '#6B7280' }}>
                Empresa <SortIcon k="nomeFantasia" />
              </th>
              <th onClick={() => toggleSort('cidade')} className="text-left pb-3 pr-4 text-xs font-bold uppercase tracking-widest cursor-pointer select-none hover:text-[#E4002B]" style={{ color: '#6B7280' }}>
                Cidade <SortIcon k="cidade" />
              </th>
              <th className="text-left pb-3 pr-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
                Contato
              </th>
              <th className="text-left pb-3 pr-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
                Regime
              </th>
              <th className="text-left pb-3 pr-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
                Faturamento
              </th>
              <th onClick={() => toggleSort('tempoAbertura')} className="text-left pb-3 pr-4 text-xs font-bold uppercase tracking-widest cursor-pointer select-none hover:text-[#E4002B]" style={{ color: '#6B7280' }}>
                Tempo <SortIcon k="tempoAbertura" />
              </th>
              <th onClick={() => toggleSort('googleNota')} className="text-left pb-3 pr-4 text-xs font-bold uppercase tracking-widest cursor-pointer select-none hover:text-[#E4002B]" style={{ color: '#6B7280' }}>
                Google <SortIcon k="googleNota" />
              </th>
              <th className="text-left pb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
                Classificar
              </th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(emp => (
              <tr
                key={emp.id}
                className="transition-colors hover:bg-[#111111]"
                style={{ borderBottom: '1px solid #1E1E1E' }}
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold truncate max-w-[180px]" style={{ color: '#F9FAFB' }}>
                      {emp.nomeFantasia || emp.razaoSocial || '—'}
                    </span>
                    {isFilial(emp.cnpj) && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                        style={{ background: '#1A0008', color: '#E4002B', border: '1px solid #E4002B' }}
                      >
                        FILIAL
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#4B5563' }}>{emp.cnae}</div>
                </td>

                <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: '#9CA3AF' }}>
                  {emp.cidade}/{emp.estado}
                </td>

                <td className="py-3 pr-4">
                  {emp.telefone1 ? (
                    <a
                      href={`tel:${emp.telefone1}`}
                      className="text-xs font-medium block hover:underline"
                      style={{ color: '#E4002B' }}
                    >
                      {emp.telefone1.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')}
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: '#374151' }}>—</span>
                  )}
                  {emp.email && (
                    <a
                      href={`mailto:${emp.email}`}
                      className="text-xs block truncate max-w-[140px] hover:underline"
                      style={{ color: '#4B5563' }}
                    >
                      {emp.email.toLowerCase()}
                    </a>
                  )}
                </td>

                <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                  {emp.regimeTributario ?? '—'}
                </td>

                <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                  {emp.faturamentoEstimado ?? '—'}
                </td>

                <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>
                  {tempoDeAbertura(emp.dataAbertura)}
                </td>

                <td className="py-3 pr-4 text-xs whitespace-nowrap">
                  {emp.googleNota ? (
                    <span style={{ color: '#FCD34D' }}>
                      {emp.googleNota}★{' '}
                      <span style={{ color: '#6B7280' }}>({emp.googleAvaliacoes})</span>
                    </span>
                  ) : (
                    <span style={{ color: '#374151' }}>—</span>
                  )}
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
