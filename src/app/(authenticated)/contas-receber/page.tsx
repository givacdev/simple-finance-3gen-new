'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ContasReceber() {
  const [user, setUser] = useState<any>(null);
  const [contas, setContas] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadContas(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadContas = async (userId: string) => {
    const { data } = await supabase
      .from('contas_receber')
      .select('*, clientes(nome)')
      .eq('user_id', userId)
      .order('data_vencimento', { ascending: true });
    setContas(data || []);
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-bold flex items-center gap-4">
            <span className="text-green-500">🟢</span> Contas a Receber
          </h1>
          <p className="text-xl text-gray-400 mt-2">Gerencie suas receitas e recebíveis</p>
        </div>
        <Link href="/contas-receber/nova">
          <button className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-bold text-xl">
            + Nova Conta a Receber
          </button>
        </Link>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <input placeholder="Buscar por cliente, fatura ou observação..." className="w-full p-4 bg-gray-800 rounded-lg" />
        </div>

        <div className="divide-y divide-gray-800">
          {contas.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">Nenhuma conta a receber cadastrada.</p>
          ) : (
            contas.map((conta) => (
              <div key={conta.id} className="p-8 hover:bg-gray-800 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-bold">{conta.clientes?.nome || 'Sem cliente'}</p>
                    <p className="text-gray-400 mt-2">Fatura #{conta.id} • Valor Total: R$ {Number(conta.vl_parcela).toFixed(2)}</p>
                    <p className="text-gray-500">Obs: Receita recorrente - gerada automaticamente</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-yellow-900/50 px-4 py-2 rounded-lg text-yellow-300">Atrasado</span>
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <div>
                    <p>PARCELA 1/1</p>
                    <p className="text-gray-400">VENCIMENTO {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-3xl font-bold">R$ {Number(conta.vl_parcela).toFixed(2)}</div>
                  <button className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-bold">
                    Receber
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}