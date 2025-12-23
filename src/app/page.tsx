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
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage('Erro: ' + error.message);
      else router.push('/dashboard');
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://simple-finance-3gen-new.vercel.app/dashboard',
        },
      });
      if (error) setMessage('Erro: ' + error.message);
      else setMessage('Conta criada! Verifique seu e-mail.');
    }
  };

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-6xl font-bold mb-6">Simple Finance 3Gen</h1>
          <p className="text-2xl mb-8">Gestão financeira simples, bonita e poderosa para o seu dia a dia</p>
          <button onClick={() => setShowForm(true)} className="bg-white text-purple-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-100">
            Comece Grátis Agora
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-12">Recursos que vão mudar sua vida financeira</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-gray-900 p-10 rounded-2xl">
              <h3 className="text-3xl font-bold mb-4">Dashboard Intuitivo</h3>
              <p className="text-xl text-gray-400">Visualize tudo em tempo real: a pagar, a receber e saldo.</p>
            </div>
            <div className="bg-gray-900 p-10 rounded-2xl">
              <h3 className="text-3xl font-bold mb-4">Controle Total</h3>
              <p className="text-xl text-gray-400">Lançamentos, categorias, relatórios – tudo na palma da mão.</p>
            </div>
            <div className="bg-gray-900 p-10 rounded-2xl">
              <h3 className="text-3xl font-bold mb-4">Segurança Máxima</h3>
              <p className="text-xl text-gray-400">Seus dados protegidos com Supabase e criptografia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-12">Planos Simples e Transparentes</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-gray-800 p-10 rounded-2xl">
              <h3 className="text-3xl font-bold mb-4">Grátis</h3>
              <p className="text-5xl font-bold mb-8">R$ 0<span className="text-xl">/mês</span></p>
              <ul className="text-left text-gray-400 mb-8 space-y-4">
                <li>✓ Dashboard básico</li>
                <li>✓ Lançamentos ilimitados</li>
                <li>✓ Relatórios simples</li>
              </ul>
              <button onClick={() => setShowForm(true)} className="w-full bg-gray-600 py-4 rounded-xl font-bold">
                Começar Grátis
              </button>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 rounded-2xl">
              <h3 className="text-3xl font-bold mb-4">Premium</h3>
              <p className="text-5xl font-bold mb-8">R$ 35,90<span className="text-xl">/mês</span></p>
              <ul className="text-left mb-8 space-y-4">
                <li>✓ Tudo do Grátis</li>
                <li>✓ Relatórios avançados</li>
                <li>✓ Export PDF/CSV</li>
                <li>✓ Suporte prioritário</li>
              </ul>
              <button onClick={() => setShowForm(true)} className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold">
                Testar 7 Dias Grátis
              </button>
            </div>
            <div className="bg-gray-800 p-10 rounded-2xl">
              <h3 className="text-3xl font-bold mb-4">Lançamento</h3>
              <p className="text-5xl font-bold mb-8">R$ 47,90<span className="text-xl">/ano</span></p>
              <ul className="text-left text-gray-400 mb-8 space-y-4">
                <li>✓ Premium por 12 meses</li>
                <li>✓ Economia de R$ 383</li>
                <li>✓ Apenas pros primeiros 50</li>
              </ul>
              <button onClick={() => setShowForm(true)} className="w-full bg-yellow-600 py-4 rounded-xl font-bold">
                Garantir Oferta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-bold mb-8">Pronto para transformar sua vida financeira?</h2>
          <button onClick={() => setShowForm(true)} className="bg-white text-purple-600 px-12 py-6 rounded-full font-bold text-2xl hover:bg-gray-100">
            Comece Grátis Agora
          </button>
        </div>
      </section>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 p-10 rounded-3xl shadow-2xl w-full max-w-md">
            <h2 className="text-3xl font-bold text-center mb-8">{isLogin ? "Entrar" : "Criar conta grátis"}</h2>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 mb-4 bg-gray-800 rounded-lg"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 mb-6 bg-gray-800 rounded-lg"
            />
            {message && <p className={`text-center mb-6 ${message.includes('Erro') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
            <button onClick={handleAuth} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-lg font-bold text-xl">
              {isLogin ? "Entrar" : "Criar conta grátis"}
            </button>
            <p className="text-center mt-6">
              <button onClick={() => setIsLogin(!isLogin)} className="text-yellow-300 hover:underline">
                {isLogin ? "Criar conta grátis" : "Já tem conta? Entrar"}
              </button>
            </p>
            <button onClick={() => setShowForm(false)} className="text-center w-full mt-4 text-gray-400">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
