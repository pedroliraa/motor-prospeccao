const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getLeads(): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/leads`);
  return res.json();
}

export async function iniciarBusca(
  somentePrimario = false,
  cnaes: string[] = [],
  estados: string[] = [],
  municipios: string[] = [],
  porte: string[] = [],
) {
  const res = await fetch(`${API_URL}/api/execucoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ somentePrimario, cnaes, estados, municipios, porte }),
  });
  return res.json();
}

export async function getMunicipios(q: string): Promise<string[]> {
  if (q.length < 2) return [];
  const res = await fetch(`${API_URL}/api/municipios?q=${encodeURIComponent(q)}`);
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

export async function getCnaes(): Promise<{ codigo: string; descricao: string }[]> {
  const res = await fetch(`${API_URL}/api/cnaes`);
  return res.json();
}

export async function getWhatsAppStatus() {
  const res = await fetch(`${API_URL}/api/whatsapp/status`);
  return res.json();
}

export async function verificarTodosWhatsApp() {
  const res = await fetch(`${API_URL}/api/whatsapp/verificar-todos`, { method: 'POST' });
  return res.json();
}

export async function conectarWhatsApp() {
  await fetch(`${API_URL}/api/whatsapp/conectar`, { method: 'POST' });
}

export async function atualizarNotas(id: number, notas: string) {
  const res = await fetch(`${API_URL}/api/leads/${id}/notas`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notas }),
  });
  return res.json();
}