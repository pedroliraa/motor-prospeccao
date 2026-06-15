'use client';
import { Empresa } from '../types/index';

interface Props {
  empresas: Empresa[];
}

function Badge({ classificacao }: { classificacao: string | null }) {
  if (!classificacao) return <span className="text-xs text-gray-400">—</span>;
  const map: Record<string, string> = {
    'Quente': 'bg-green-100 text-green-700',
    'Morno': 'bg-yellow-100 text-yellow-700',
    'Frio': 'bg-gray-100 text-gray-500',
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

export default function TabelaLeads({ empresas }: Props) {
  if (empresas.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        Nenhum lead encontrado. Execute uma busca para começar.
      </div>
    );
  }

  return (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Empresa</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Cidade</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Regime</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Faturamento est.</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Google</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3 pr-4">Score</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pb-3">Classe</th>
        </tr>
      </thead>
      <tbody>
        {empresas.map(emp => (
          <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td className="py-3 pr-4">
              <div className="font-medium text-gray-800 truncate max-w-[200px]">
                {emp.nomeFantasia || emp.razaoSocial || '—'}
              </div>
              <div className="text-xs text-gray-400">{emp.cnae}</div>
            </td>
            <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
              {emp.cidade}/{emp.estado}
            </td>
            <td className="py-3 pr-4 text-gray-600">
              {emp.regimeTributario ?? '—'}
            </td>
            <td className="py-3 pr-4 text-gray-600">
              {emp.faturamentoEstimado ?? '—'}
            </td>
            <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
              {emp.googleNota
                ? `${emp.googleNota}★ (${emp.googleAvaliacoes})`
                : '—'}
            </td>
            <td className="py-3 pr-4 min-w-[100px]">
              <ScoreBar score={emp.score} />
            </td>
            <td className="py-3">
              <Badge classificacao={emp.classificacao} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
}