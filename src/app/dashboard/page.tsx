'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [totals, setTotals] = useState({ pagar: 0, receber: 0, saldo: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createCheckout = async (priceId: string) => {
    if (!user) return; // segurança extra
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId: user.id }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      const currentUser = data.session.user;
      setUser(currentUser);
      const metadata = currentUser.user_metadata || {};
      setIsAdmin(metadata.role === 'admin');

      const { data: pagar } = await supabase.from('contas_pagar').select('vl_parcela');
      const { data: receber } = await supabase.from('contas_receber').select('vl_parcela');

      const totalPagar = pagar?.reduce((s: number, i: any) => s + Number(i.vl_parcela), 0) || 0;
      const totalReceber = receber?.reduce((s: number, i: any) => s + Number(i.vl_parcela), 0) || 0;

      setTotals({ pagar: totalPagar, receber: totalReceber, saldo: totalReceber - totalPagar });
    };
    checkSession();
  }, [router]);

  if (!user) return <p className="text-center text-white">Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-7xl font-bold text-center mb-8 text-green-400">TÁ VIVO PORRA!!!</h1>
        <p className="text-3xl text-center mb-4">Simple Finance 3Gen rodando 100% com Supabase</p>
        {isAdmin && <p className="text-2xl text-center text-yellow-400 mb-8">Você é ADMIN – acesso total ativado</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-red-900/50 p-8 rounded-2xl text-center">
            <h2 className="text-3xl mb-4">A PAGAR</h2>
            <p className="text-6xl font-bold">R$ {totals.pagar.toFixed(2)}</p>
          </div>
          <div className="bg-green-900/50 p-8 rounded-2xl text-center">
            <h2 className="text-3xl mb-4">A RECEBER</h2>
            <p className="text-6xl font-bold">R$ {totals.receber.toFixed(2)}</p>
          </div>
          <div className="bg-blue-900/50 p-8 rounded-2xl text-center">
            <h2 className="text-3xl mb-4">SALDO</h2>
            <p className="text-6xl font-bold">R$ {totals.saldo.toFixed(2)}</p>
          </div>
        </div>

        {!isAdmin && (
          <div className="text-center mb-12">
            <button
              onClick={() => createCheckout('price_1Oxxxxxx')} // troca pelo teu priceId real do Stripe
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-12 py-6 rounded-2xl text-2xl font-bold"
            >
              {loading ? 'Carregando...' : 'Upgrade Premium – R$47,90 por 12 meses (PIX ou cartão)'}
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="text-center bg-gray-800 p-8 rounded-xl">
            <p className="text-2xl mb-6 text-yellow-300">Área exclusiva Admin</p>
            <button className="bg-yellow-600 hover:bg-yellow-700 px-8 py-4 rounded-xl text-xl font-bold mr-6">
              Ver Todos os Usuários
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl text-xl font-bold">
              Acesso ao Database (em breve)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
