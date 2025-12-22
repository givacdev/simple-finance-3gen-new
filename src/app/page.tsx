'use client';

import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async () => {
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage('Erro: ' + error.message);
      else router.push('/dashboard');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage('Erro: ' + error.message);
      else setMessage('Conta criada! Verifique seu e-mail e faça login.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg p-10 rounded-3xl shadow-2xl w-full max-w-md text-white">
        <h1 className="text-5xl font-bold text-center mb-8">Simple Finance 3Gen</h1>
        <h2 className="text-2xl text-center mb-8">{isLogin ? "Entrar" : "Criar conta grátis"}</h2>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 mb-4 bg-white/20 rounded-lg placeholder-gray-300"
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 mb-6 bg-white/20 rounded-lg placeholder-gray-300"
          required
        />

        {message && <p className={`text-center mb-8 ${message.includes('Erro') ? 'text-red-300' : 'text-green-300'}`}>{message}</p>}

        <button
          onClick={handleAuth}
          className="w-full bg-white text-purple-900 font-bold py-4 rounded-lg text-xl hover:bg-gray-200 transition"
        >
          {isLogin ? "Entrar" : "Criar conta grátis"}
        </button>

        <p className="text-center mt-6">
          <button onClick={() => setIsLogin(!isLogin)} className="text-yellow-300 hover:underline">
            {isLogin ? "Criar conta grátis" : "Já tem conta? Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}