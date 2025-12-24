'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ContasPagar() {
  const [user, setUser] = useState<any>(null);
  const [contas, setContas] = useState<any[]>([]);
  const [totalPendente, setTotalPendente] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else {
        setUser(data.session.user);
        loadContas(data.session.user.id);
      }
    };
    checkSession();
  }, [router]);

  const loadContas = async (userId: string) => {
    const { data } = await supabase
      .from('contas_pagar')
      .select('*, fornecedores(nome, codigo)')
      .eq('user_id', userId)
      .order('data_vencimento', { ascending: true });

    setContas(data || []);

    const total = data?.reduce((sum, c) => sum + Number(c.valor_parcela), 0) || 0;
    setTotalPendente(total);
  };

  const isAtrasado = (vencimento: string) => new Date(vencimento) < new Date();
  const isProximo = (vencimento: string) => {
    const diff = new Date(vencimento).getTime() - new Date().getTime();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-bold flex items-center gap-4">
            <span className="text-red-500">🔴</span> Contas a Pagar
          </h1>
          <p className="text-xl text-gray-400 mt-2">Gerencie suas obrigações financeiras</p>
        </div>
        <Link href="/contas-pagar/nova">
          <button className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-xl">
            + Nova Conta a Pagar
          </button>
        </Link>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <input placeholder="Buscar por fornecedor, fatura ou observação..." className="w-full p-4 bg-gray-800 rounded-lg" />
        </div>

        <div className="divide-y divide-gray-800">
          {contas.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">Nenhuma conta a pagar cadastrada.</p>
          ) : (
            contas.map((conta) => (
              <div key={conta.id} className="p-8 hover:bg-gray-800 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-3xl font-bold">{conta.fornecedores?.nome || 'Sem fornecedor'}</p>
                    <p className="text-gray-400">Fatura #{conta.fatura || conta.id} • Valor Total R$ {Number(conta.valor_total).toFixed(2)}</p>
                  </div>
                  <div>
                    {isAtrasado(conta.data_vencimento) && <span className="bg-red-900/50 px-4 py-2 rounded-lg text-red-300 font-bold">Atrasado</span>}
                    {isProximo(conta.data_vencimento) && !isAtrasado(conta.data_vencimento) && <span className="bg-orange-900/50 px-4 py-2 rounded-lg text-orange-300 font-bold">Próxima</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl">PARCELA {conta.parcela_atual}/{conta.parcelas}</p>
                    <p className="text-gray-400">VENCIMENTO {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-3xl font-bold">R$ {Number(conta.valor_parcela).toFixed(2)}</div>
                  <button className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-bold text-xl">
                    Pagar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-800 text-right">
          <p className="text-3xl font-bold">Total Pendente: R$ {totalPendente.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}