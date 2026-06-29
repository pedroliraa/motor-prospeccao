export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getUsuario(): { id: number; nome: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/login';
}