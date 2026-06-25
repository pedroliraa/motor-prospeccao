const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getLeads(): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/leads`);
  return res.json();
}

export async function iniciarBusca(somentePrimario = false) {
  const res = await fetch(`${API_URL}/api/execucoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ somentePrimario }),
  });
  return res.json();
}

export async function getStatusExecucao(id: number) {
  const res = await fetch(`${API_URL}/api/execucoes/${id}`);
  return res.json();
}

export async function iniciarEnriquecimento() {
  const res = await fetch(`${API_URL}/api/enriquecimento`, { method: 'POST' });
  return res.json();
}

export async function getStatusEnriquecimento() {
  const res = await fetch(`${API_URL}/api/enriquecimento/status`);
  return res.json();
}

export async function iniciarPresencaDigital() {
  const res = await fetch(`${API_URL}/api/presenca-digital`, { method: 'POST' });
  return res.json();
}

export async function getStatusPresencaDigital() {
  const res = await fetch(`${API_URL}/api/presenca-digital/status`);
  return res.json();
}

export async function exportarExcel() {
  const res = await fetch(`${API_URL}/api/export/excel`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads_qualificados.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function getEtiquetas() {
  const res = await fetch(`${API_URL}/api/etiquetas`);
  return res.json();
}

export async function criarEtiqueta(nome: string, cor: string) {
  const res = await fetch(`${API_URL}/api/etiquetas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, cor }),
  });
  return res.json();
}

export async function deletarEtiqueta(id: number) {
  await fetch(`${API_URL}/api/etiquetas/${id}`, { method: 'DELETE' });
}

export async function atualizarClassificacao(id: number, classificacao: string | null) {
  const res = await fetch(`${API_URL}/api/leads/${id}/classificacao`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classificacao }),
  });
  return res.json();
}