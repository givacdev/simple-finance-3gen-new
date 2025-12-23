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
  const router = useRouter();

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

      // Puxa totais reais do usuário (tu cria as tabelas contas_pagar e contas_receber por usuário depois)
      const userId = currentUser.id;
      const { data: pagar } = await supabase
        .from('contas_pagar')
        .select('vl_parcela')
        .eq('user_id', userId);

      const { data: receber } = await supabase
        .from('contas_receber')
        .select('vl_parcela')
        .eq('user_id', userId);

      const totalPagar = pagar?.reduce((s: number, i: any) => s + Number(i.vl_parcela), 0) || 0;
      const totalReceber = receber?.reduce((s: number, i: any) => s + Number(i.vl_parcela), 0) || 0;

      setTotals({ pagar: totalPagar, receber: totalReceber, saldo: totalReceber - totalPagar });
    };
    checkSession();
  }, [router]);

  if (!user) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-white text-2xl">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-8">
        <header className="mb-12">
          <h1 className="text-5xl font-bold mb-2">Bem-vindo de volta, {user.email.split('@')[0]}!</h1>
          <p className="text-xl text-gray-400">Aqui está o resumo das suas finanças hoje</p>
          {isAdmin && <p className="text-lg text-yellow-400 mt-4">Você é ADMIN – acesso total ativado</p>}
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-red-900/30 p-8 rounded-2xl border border-red-800">
            <h2 className="text-2xl mb-4 opacity-80">A Pagar</h2>
            <p className="text-5xl font-bold">R$ {totals.pagar.toFixed(2)}</p>
          </div>
          <div className="bg-green-900/30 p-8 rounded-2xl border border-green-800">
            <h2 className="text-2xl mb-4 opacity-80">A Receber</h2>
            <p className="text-5xl font-bold">R$ {totals.receber.toFixed(2)}</p>
          </div>
          <div className="bg-blue-900/30 p-8 rounded-2xl border border-blue-800">
            <h2 className="text-2xl mb-4 opacity-80">Saldo Atual</h2>
            <p className="text-5xl font-bold">R$ {totals.saldo.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-6">Próximos Lançamentos</h3>
            <p className="text-gray-400">Em breve: lista de contas próximas do vencimento</p>
          </div>
          <div className="bg-gray-900 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-6">Metas Financeiras</h3>
            <p className="text-gray-400">Em breve: acompanhe suas metas de poupança</p>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-16 bg-gray-800 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-6 text-yellow-300">Área exclusiva Admin</h3>
            <div className="flex gap-6">
              <button className="bg-yellow-600 hover:bg-yellow-700 px-8 py-4 rounded-xl font-bold">
                Ver Todos os Usuários
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-bold">
                Acesso ao Database (em breve)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
