'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function LoginPage() {
    const router = useRouter();
    const [modo, setModo] = useState<'login' | 'cadastro'>('login');
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        setErro(''); setLoading(true);
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) return setErro(data.error);
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        router.push('/');
    }

    async function handleCadastro() {
        setErro(''); setSucesso(''); setLoading(true);
        const res = await fetch(`${API_URL}/api/auth/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) return setErro(data.error);
        setSucesso(data.mensagem);
        setModo('login');
    }

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6', fontFamily: "'Sansation', Arial, sans-serif" }}>
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="flex justify-start mb-8 pl-2">
                    <img src="/impulse-logo.png" alt="Impulse" style={{ height: '144px', width: 'auto' }} />
                </div>

                <div className="rounded-2xl p-8" style={{
                    background: '#1A1A1A',
                    border: '2px solid #E4002B',
                    boxShadow: '0 8px 32px rgba(228,0,43,0.15)'
                }}>
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        {(['login', 'cadastro'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => { setModo(m); setErro(''); setSucesso(''); }}
                                className="flex-1 py-2 text-sm font-bold rounded-lg transition-all uppercase tracking-wide"
                                style={{
                                    background: modo === m ? '#E4002B' : 'transparent',
                                    color: modo === m ? '#fff' : '#E4002B',
                                    border: modo === m ? 'none' : '1px solid #E4002B',
                                }}
                            >
                                {m === 'login' ? 'Entrar' : 'Criar conta'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {modo === 'cadastro' && (
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block font-bold uppercase tracking-wide">Nome</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                    placeholder="Seu nome completo"
                                    className="w-full text-sm rounded-lg px-3 py-2.5 text-white placeholder-gray-600"
                                    style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block font-bold uppercase tracking-wide">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full text-sm rounded-lg px-3 py-2.5 text-white placeholder-gray-600"
                                style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block font-bold uppercase tracking-wide">Senha</label>
                            <input
                                type="password"
                                value={senha}
                                onChange={e => setSenha(e.target.value)}
                                placeholder={modo === 'cadastro' ? 'Mín. 8 chars, maiúscula, número e especial' : '••••••••'}
                                className="w-full text-sm rounded-lg px-3 py-2.5 text-white placeholder-gray-600"
                                style={{ background: '#0D0D0D', border: '1px solid #2A2A2A' }}
                                onKeyDown={e => e.key === 'Enter' && (modo === 'login' ? handleLogin() : handleCadastro())}
                            />
                        </div>

                        {erro && (
                            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: '#2A0A0A', color: '#E4002B', border: '1px solid #E4002B' }}>
                                {erro}
                            </div>
                        )}

                        {sucesso && (
                            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: '#0A2A0A', color: '#4ADE80', border: '1px solid #4ADE80' }}>
                                {sucesso}
                            </div>
                        )}

                        <button
                            onClick={modo === 'login' ? handleLogin : handleCadastro}
                            disabled={loading}
                            className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all uppercase tracking-widest disabled:opacity-40"
                            style={{ background: '#E4002B' }}
                        >
                            {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
                    Motor de Prospecção Inteligente · Impulse B2B
                </p>
            </div>
        </div>
    );
}