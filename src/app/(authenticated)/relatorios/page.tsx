'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Relatorios() {
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
      <h1 className="text-5xl font-bold mb-8">Relatórios Financeiros</h1>
      <p className="text-xl text-gray-400 mb-12">Exporte e analise seus dados</p>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-red-900/30 p-8 rounded-2xl text-center border border-red-800">
          <h3 className="text-3xl font-bold mb-4">Contas a Pagar</h3>
          <p className="text-xl text-gray-400 mb-6">Relatório completo com filtros</p>
          <button className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold">CSV</button>
          <button className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold ml-4">PDF</button>
        </div>
        <div className="bg-green-900/30 p-8 rounded-2xl text-center border border-green-800">
          <h3 className="text-3xl font-bold mb-4">Contas a Receber</h3>
          <p className="text-xl text-gray-400 mb-6">Relatório completo com filtros</p>
          <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold">CSV</button>
          <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold ml-4">PDF</button>
        </div>
        <div className="bg-blue-900/30 p-8 rounded-2xl text-center border border-blue-800">
          <h3 className="text-3xl font-bold mb-4">Fluxo de Caixa</h3>
          <p className="text-xl text-gray-400 mb-6">Histórico completo de entradas/saídas</p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold">CSV</button>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold ml-4">PDF</button>
        </div>
      </div>
    </div>
  );
}