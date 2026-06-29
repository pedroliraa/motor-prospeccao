'use client';
import { useState, useEffect } from 'react';
import { getToken, getUsuario, logout } from '../../lib/auth';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUsuario();
    if (!u || u.role !== 'admin') {
      router.push('/');
      return;
    }
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    const res = await fetch(`${API_URL}/api/admin/usuarios`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const data = await res.json();
    setUsuarios(data);
    setLoading(false);
  }

  async function atualizarUsuario(id: number, ativo: boolean, role: string) {
    await fetch(`${API_URL}/api/admin/usuarios/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ ativo, role })
    });
    carregarUsuarios();
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D', fontFamily: "'Sansation', Arial, sans-serif" }}>
      
      {/* Header */}
      <header className="bg-white border-b-2 border-[#E4002B] px-8 py-0">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-5">
            <img src="/impulse-logo.png" alt="Impulse" style={{ height: '40px', width: 'auto' }} />
            <div className="w-px h-8 bg-[#E4002B]" />
            <div>
              <p className="text-black text-sm font-bold">Painel Admin</p>
              <p className="text-gray-400 text-xs">Gerenciamento de usuários</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
              style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              ← Motor
            </button>
            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
              style={{ background: '#F3F4F6', color: '#E4002B', border: '1px solid #E4002B' }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto p-6">
        <div className="rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #2A2A2A' }}>
            <p className="text-sm font-bold text-white">Usuários cadastrados</p>
            <p className="text-xs" style={{ color: '#4B5563' }}>{usuarios.length} usuários no sistema</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: '#4B5563' }}>Carregando...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                  {['Nome', 'E-mail', 'Perfil', 'Status', 'Cadastro', 'Ações'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #1E1E1E' }}>
                    <td className="px-6 py-4 font-semibold" style={{ color: '#F9FAFB' }}>{u.nome}</td>
                    <td className="px-6 py-4 text-xs" style={{ color: '#9CA3AF' }}>{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={e => atualizarUsuario(u.id, u.ativo, e.target.value)}
                        className="text-xs rounded px-2 py-1 cursor-pointer"
                        style={{ background: '#2A2A2A', color: '#F9FAFB', border: '1px solid #3A3A3A' }}
                      >
                        <option value="user">Usuário</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                        background: u.ativo ? '#0A2A0A' : '#2A0A0A',
                        color:      u.ativo ? '#4ADE80' : '#E4002B',
                        border:     `1px solid ${u.ativo ? '#4ADE80' : '#E4002B'}`
                      }}>
                        {u.ativo ? 'Ativo' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs" style={{ color: '#4B5563' }}>
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!u.ativo && (
                          <button
                            onClick={() => atualizarUsuario(u.id, true, u.role)}
                            className="text-xs px-3 py-1 rounded font-bold cursor-pointer"
                            style={{ background: '#0A2A0A', color: '#4ADE80', border: '1px solid #4ADE80' }}
                          >
                            Aprovar
                          </button>
                        )}
                        {u.ativo && (
                          <button
                            onClick={() => atualizarUsuario(u.id, false, u.role)}
                            className="text-xs px-3 py-1 rounded font-bold cursor-pointer"
                            style={{ background: '#2A0A0A', color: '#E4002B', border: '1px solid #E4002B' }}
                          >
                            Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}