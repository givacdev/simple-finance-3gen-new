'use client';

import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [mostrarReset, setMostrarReset] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setMensagem('Erro: ' + error.message);
    } else {
      router.push('/dashboard');
    }
  };

  const handleReset = async () => {
    if (!resetEmail) {
      setMensagem('Digite seu email');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-senha`,
    });

    if (error) {
      setMensagem('Erro: ' + error.message);
    } else {
      setMensagem('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setMostrarReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-10 rounded-3xl max-w-md w-full shadow-2xl">
        <h1 className="text-5xl font-bold text-center mb-12">Entrar</h1>

        <input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 mb-6 bg-gray-800 rounded-xl text-xl"
        />

        <input
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-4 mb-8 bg-gray-800 rounded-xl text-xl"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-5 rounded-xl font-bold text-2xl mb-6"
        >
          Entrar
        </button>

        <button
          onClick={() => setMostrarReset(true)}
          className="text-yellow-400 text-xl underline mb-4 block text-center"
        >
          Esqueci minha senha
        </button>

        <p className="text-center text-gray-400">
          Não tem conta? <span className="text-yellow-400 underline">Criar conta grátis</span>
        </p>

        {mensagem && (
          <p className="mt-6 text-center text-yellow-400 text-xl">{mensagem}</p>
        )}
      </div>

      {mostrarReset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-3xl max-w-md w-full">
            <h2 className="text-3xl font-bold mb-6">Recuperar senha</h2>
            <input
              type="email"
              placeholder="Seu email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-4 mb-6 bg-gray-800 rounded-xl text-xl"
            />
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-xl"
              >
                Enviar
              </button>
              <button
                onClick={() => {
                  setMostrarReset(false);
                  setMensagem('');
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-4 rounded-xl font-bold text-xl"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}