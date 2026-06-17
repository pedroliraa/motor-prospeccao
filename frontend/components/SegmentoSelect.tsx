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
      className="w-full text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E4002B] text-white"
      style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
    >
      {SEGMENTOS.map(s => (
        <option key={s} value={s} style={{ background: '#1A1A1A' }}>{s}</option>
      ))}
    </select>
  );
}