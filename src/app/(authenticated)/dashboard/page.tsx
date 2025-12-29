'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [entradasPrevistas, setEntradasPrevistas] = useState(0);
  const [saidasPrevistas, setSaidasPrevistas] = useState(0);
  const [saldoCaixa, setSaldoCaixa] = useState(0);
  const [proximasPagar, setProximasPagar] = useState<any[]>([]);
  const [proximasReceber, setProximasReceber] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadDashboard(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadDashboard = async (userId: string) => {
    // Contas a receber pendentes
    const { data: receber } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('recebido', false);

    const totalReceber = (receber || []).reduce((sum: number, c: any) => sum + Number(c.valor_parcela), 0);
    setEntradasPrevistas(totalReceber);

    // Contas a pagar pendentes
    const { data: pagar } = await supabase
      .from('contas_pagar')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('pago', false);

    const totalPagar = (pagar || []).reduce((sum: number, c: any) => sum + Number(c.valor_parcela), 0);
    setSaidasPrevistas(totalPagar);

    // Saldo atual do caixa (movimentos reais)
    const { data: movimentos } = await supabase
      .from('movimentos_caixa')
      .select('valor, tipo')
      .eq('user_id', userId);

    let saldo = 0;
    (movimentos || []).forEach((m: any) => {
      if (m.tipo === 'entrada') saldo += Number(m.valor);
      else saldo -= Number(m.valor);
    });
    setSaldoCaixa(saldo);

    // Próximas a pagar
    const { data: proxPagar } = await supabase
      .from('contas_pagar')
      .select('*, fornecedores(nome)')
      .eq('user_id', userId)
      .eq('pago', false)
      .order('data_vencimento', { ascending: true })
      .limit(5);
    setProximasPagar(proxPagar || []);

    // Próximas a receber
    const { data: proxReceber } = await supabase
      .from('contas_receber')
      .select('*, clientes(nome)')
      .eq('user_id', userId)
      .eq('recebido', false)
      .order('data_vencimento', { ascending: true })
      .limit(5);
    setProximasReceber(proxReceber || []);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  if (!user) return null;

  const saldoProjetado = entradasPrevistas - saidasPrevistas;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-12 text-center">Dashboard Financeiro</h1>

      <div className="grid md:grid-cols-4 gap-8 mb-16">
        <div className="bg-green-900 p-10 rounded-3xl text-center shadow-2xl">
          <p className="text-2xl text-green-300 mb-4">Entradas Previstas</p>
          <p className="text-6xl font-bold">R$ {entradasPrevistas.toFixed(2)}</p>
        </div>
        <div className="bg-red-900 p-10 rounded-3xl text-center shadow-2xl">
          <p className="text-2xl text-red-300 mb-4">Saídas Previstas</p>
          <p className="text-6xl font-bold">R$ {saidasPrevistas.toFixed(2)}</p>
        </div>
        <div className={`p-10 rounded-3xl text-center shadow-2xl ${saldoProjetado >= 0 ? 'bg-blue-900' : 'bg-orange-900'}`}>
          <p className="text-2xl text-gray-300 mb-4">Saldo Projetado</p>
          <p className={`text-6xl font-bold ${saldoProjetado >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>
            R$ {saldoProjetado.toFixed(2)}
          </p>
        </div>
        <div className={`p-10 rounded-3xl text-center shadow-2xl ${saldoCaixa >= 0 ? 'bg-purple-900' : 'bg-pink-900'}`}>
          <p className="text-2xl text-gray-300 mb-4">Saldo Atual do Caixa</p>
          <p className={`text-6xl font-bold ${saldoCaixa >= 0 ? 'text-purple-300' : 'text-pink-300'}`}>
            R$ {saldoCaixa.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-gray-900 p-8 rounded-3xl">
          <h2 className="text-3xl font-bold mb-6 flex items-center justify-between">
            Próximas Contas a Pagar
            <Link href="/contas-pagar" className="text-red-400 text-xl hover:underline">Ver todas →</Link>
          </h2>
          {proximasPagar.length === 0 ? (
            <p className="text-center text-gray-400 text-xl py-12">Nenhuma conta a pagar pendente</p>
          ) : (
            <div className="space-y-4">
              {proximasPagar.map((conta) => (
                <div key={conta.id} className="bg-gray-800 p-6 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold">{conta.fornecedores?.nome}</p>
                      <p className="text-gray-400">Fatura #{conta.fatura} • Parcela {conta.parcela_atual}/{conta.parcelas}</p>
                      <p className="text-gray-500">Vencimento: {formatDate(conta.data_vencimento)}</p>
                    </div>
                    <p className="text-3xl font-bold text-red-400">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 p-8 rounded-3xl">
          <h2 className="text-3xl font-bold mb-6 flex items-center justify-between">
            Próximas Contas a Receber
            <Link href="/contas-receber" className="text-green-400 text-xl hover:underline">Ver todas →</Link>
          </h2>
          {proximasReceber.length === 0 ? (
            <p className="text-center text-gray-400 text-xl py-12">Nenhuma conta a receber pendente</p>
          ) : (
            <div className="space-y-4">
              {proximasReceber.map((conta) => (
                <div key={conta.id} className="bg-gray-800 p-6 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold">{conta.clientes?.nome}</p>
                      <p className="text-gray-400">Fatura #{conta.fatura} • Parcela {conta.parcela_atual}/{conta.parcelas}</p>
                      <p className="text-gray-500">Vencimento: {formatDate(conta.data_vencimento)}</p>
                    </div>
                    <p className="text-3xl font-bold text-green-400">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}