'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Conta {
  id: string;
  cliente?: { nome: string };
  fatura: string;
  valor_parcela: number;
  data_vencimento: string;
  recebido: boolean;
  observacoes?: string;
}

export default function ContasReceber() {
  const [user, setUser] = useState<any>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [busca, setBusca] = useState('');
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
      .select('id, fatura, valor_parcela, data_vencimento, recebido, observacoes, cliente:clientes(nome)')
      .eq('user_id', userId)
      .eq('recebido', false)
      .order('data_vencimento', { ascending: true });

    setContas(data || []);
  };

  const contasFiltradas = contas.filter(conta => {
    const termo = busca.toLowerCase();
    return (
      conta.cliente?.nome?.toLowerCase().includes(termo) ||
      conta.fatura?.toLowerCase().includes(termo) ||
      conta.observacoes?.toLowerCase().includes(termo)
    );
  });

  const estaVencida = (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    return vencimento < hoje;
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold text-green-400">Contas a Receber</h1>
        <button 
          onClick={() => router.push('/contas-receber/nova')}
          className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-bold text-xl"
        >
          + Nova Conta a Receber
        </button>
      </div>

      <div className="mb-8">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente, fatura ou observação..."
          className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
        />
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {contasFiltradas.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">Nenhuma conta a receber pendente.</p>
          ) : (
            contasFiltradas.map((conta) => (
              <div key={conta.id} className="p-8 hover:bg-gray-800 transition flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{conta.cliente?.nome || 'Sem cliente'}</p>
                  <p className="text-gray-400 mt-2">Fatura #{conta.fatura}</p>
                  {conta.observacoes && <p className="text-gray-500">Obs: {conta.observacoes}</p>}
                  <p className="mt-2">
                    VENCIMENTO {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                    {estaVencida(conta.data_vencimento) && <span className="text-red-400 ml-4 font-bold">VENCIDA</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-green-400">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  <button className="mt-4 bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-bold text-xl">
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