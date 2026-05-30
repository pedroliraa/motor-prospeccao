'use client';

const SEGMENTOS = [
  'Material de Construção',
  'Clínicas e Saúde',
  'Restaurantes e Alimentação',
  'Oficinas e Automotivo',
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SegmentoSelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {SEGMENTOS.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}