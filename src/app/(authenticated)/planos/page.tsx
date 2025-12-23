'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Planos() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else setUser(data.session.user);
    };
    checkSession();
  }, [router]);

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-12 text-center">Planos e Preços</h1>
      <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
        <div className="bg-gray-800 p-10 rounded-2xl text-center">
          <h3 className="text-3xl font-bold mb-4">Grátis</h3>
          <p className="text-5xl font-bold mb-8">R$ 0<span className="text-xl">/mês</span></p>
          <ul className="text-left text-gray-400 mb-8 space-y-4">
            <li>✓ Dashboard básico</li>
            <li>✓ Lançamentos ilimitados</li>
            <li>✓ Até 10 contatos</li>
          </ul>
          <button className="w-full bg-gray-600 py-4 rounded-xl font-bold">Plano Atual</button>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 rounded-2xl text-center">
          <h3 className="text-3xl font-bold mb-4">Premium</h3>
          <p className="text-5xl font-bold mb-8">R$ 35,90<span className="text-xl">/mês</span></p>
          <ul className="text-left mb-8 space-y-4">
            <li>✓ Tudo do Grátis</li>
            <li>✓ Contatos ilimitados</li>
            <li>✓ Relatórios avançados</li>
            <li>✓ Export PDF/CSV</li>
          </ul>
          <button className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold">Assinar Mensal</button>
        </div>
        <div className="bg-yellow-600/20 border-4 border-yellow-600 p-10 rounded-2xl text-center">
          <h3 className="text-3xl font-bold mb-4">Lançamento</h3>
          <p className="text-5xl font-bold mb-8">R$ 47,90<span className="text-xl">/ano</span></p>
          <ul className="text-left mb-8 space-y-4">
            <li>✓ Premium por 12 meses</li>
            <li>✓ Economia de R$ 383</li>
            <li>✓ Apenas pros primeiros 50</li>
          </ul>
          <button className="w-full bg-yellow-600 hover:bg-yellow-700 py-4 rounded-xl font-bold">Garantir Oferta</button>
        </div>
      </div>
    </div>
  );
}