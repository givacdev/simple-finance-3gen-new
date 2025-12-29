'use client';

import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetSenha() {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensagem, setMensagem] = useState('');
  const router = useRouter();

  const handleReset = async () => {
    if (novaSenha !== confirmar) {
      setMensagem('As senhas não coincidem');
      return;
    }

    if (novaSenha.length < 6) {
      setMensagem('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) {
      setMensagem('Erro: ' + error.message);
    } else {
      setMensagem('Senha alterada com sucesso! Redirecionando...');
      setTimeout(() => router.push('/'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-10 rounded-3xl max-w-md w-full shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-12">Nova Senha</h1>

        <input
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          className="w-full p-4 mb-6 bg-gray-800 rounded-xl text-xl"
        />

        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className="w-full p-4 mb-8 bg-gray-800 rounded-xl text-xl"
        />

        <button
          onClick={handleReset}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-5 rounded-xl font-bold text-2xl"
        >
          Alterar Senha
        </button>

        {mensagem && (
          <p className="mt-8 text-center text-yellow-400 text-xl">{mensagem}</p>
        )}
      </div>
    </div>
  );
}