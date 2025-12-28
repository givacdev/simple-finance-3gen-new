'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MovimentoCaixa() {
  const [user, setUser] = useState<any>(null);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadMovimentos(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadMovimentos = async (userId: string) => {
    // Carrega contas a pagar
    const { data: pagar } = await supabase
      .from('contas_pagar')
      .select('*, fornecedores(nome)')
      .eq('user_id', userId);

    // Carrega contas a receber
    const { data: receber } = await supabase
      .from('contas_receber')
      .select('*, clientes(nome)')
      .eq('user_id', userId);

    // Junta tudo
    const todos = [
      ...(pagar || []).map((c: any) => ({ ...c, tipo: 'pagar', nome: c.fornecedores?.nome || 'Sem fornecedor' })),
      ...(receber || []).map((c: any) => ({ ...c, tipo: 'receber', nome: c.clientes?.nome || 'Sem cliente' })),
    ];

    // Ordena por data_vencimento
    todos.sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

    setMovimentos(todos);

    // Calcula totais (só pendentes)
    let entradas = 0;
    let saidas = 0;
    todos.forEach((m: any) => {
      if (m.tipo === 'receber') entradas += Number(m.valor_parcela);
      if (m.tipo === 'pagar') saidas += Number(m.valor_parcela);
    });

    setTotalEntradas(entradas);
    setTotalSaidas(saidas);
    setSaldo(entradas - saidas);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  const isVencida = (dateStr: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(dateStr + 'T12:00:00');
    return venc < hoje;
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <span className="text-blue-500">📊</span> Movimento de Caixa
      </h1>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-green-900 p-8 rounded-2xl text-center">
          <p className="text-2xl text-green-300">Entradas Previstas</p>
          <p className="text-5xl font-bold mt-4">R$ {totalEntradas.toFixed(2)}</p>
        </div>
        <div className="bg-red-900 p-8 rounded-2xl text-center">
          <p className="text-2xl text-red-300">Saídas Previstas</p>
          <p className="text-5xl font-bold mt-4">R$ {totalSaidas.toFixed(2)}</p>
        </div>
        <div className={`p-8 rounded-2xl text-center ${saldo >= 0 ? 'bg-blue-900' : 'bg-orange-900'}`}>
          <p className="text-2xl text-gray-300">Saldo Projetado</p>
          <p className={`text-5xl font-bold mt-4 ${saldo >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>
            R$ {saldo.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-3xl font-bold">Lançamentos</h2>
        </div>

        <div className="divide-y divide-gray-800">
          {movimentos.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">Nenhum lançamento cadastrado.</p>
          ) : (
            movimentos.map((m) => (
              <div key={m.id} className="p-8 hover:bg-gray-800 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-bold">{m.nome}</p>
                    <p className="text-gray-400 mt-2">
                      Fatura #{m.fatura} • {m.tipo === 'receber' ? 'Entrada' : 'Saída'}
                    </p>
                    <p className="text-gray-500">Parcela {m.parcela_atual}/{m.parcelas} • Obs: {m.observacoes || 'Sem observações'}</p>
                  </div>
                  {isVencida(m.data_vencimento) && (
                    <span className="text-yellow-500 font-bold text-xl">Vencido</span>
                  )}
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <div>
                    <p className="text-gray-400">VENCIMENTO {formatDate(m.data_vencimento)}</p>
                  </div>
                  <div className={`text-3xl font-bold ${m.tipo === 'receber' ? 'text-green-400' : 'text-red-400'}`}>
                    {m.tipo === 'receber' ? '+' : '-'} R$ {Number(m.valor_parcela).toFixed(2)}
                  </div>
                  <button className={`${m.tipo === 'receber' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} px-8 py-4 rounded-xl font-bold`}>
                    {m.tipo === 'receber' ? 'Receber' : 'Pagar'}
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