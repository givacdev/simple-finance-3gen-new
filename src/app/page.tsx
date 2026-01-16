'use client';

import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabaseClient';

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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-8">
      <div className="bg-gray-900 p-8 sm:p-12 rounded-3xl w-full max-w-md shadow-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-10 sm:mb-12">Entrar</h1>

        <input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 mb-6 bg-gray-800 rounded-xl text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
        />

        <input
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-4 mb-8 bg-gray-800 rounded-xl text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-5 rounded-xl font-bold text-xl sm:text-2xl mb-6 transition"
        >
          Entrar
        </button>

        <button
          onClick={() => setMostrarReset(true)}
          className="text-yellow-400 text-lg sm:text-xl underline mb-4 block text-center hover:text-yellow-300 transition"
        >
          Esqueci minha senha
        </button>

        <p className="text-center text-gray-400 text-lg">
          Não tem conta? <span className="text-yellow-400 underline hover:text-yellow-300 cursor-pointer">Criar conta grátis</span>
        </p>

        {mensagem && (
          <p className="mt-6 text-center text-yellow-400 text-lg sm:text-xl">{mensagem}</p>
        )}
      </div>

      {/* Modal de recuperação */}
      {mostrarReset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-center">Recuperar senha</h2>
            <input
              type="email"
              placeholder="Seu email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-4 mb-6 bg-gray-800 rounded-xl text-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-xl transition"
              >
                Enviar
              </button>
              <button
                onClick={() => {
                  setMostrarReset(false);
                  setMensagem('');
                  setResetEmail('');
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-4 rounded-xl font-bold text-xl transition"
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