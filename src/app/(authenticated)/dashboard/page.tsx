'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  ArrowDownCircleIcon, 
  ArrowUpCircleIcon, 
  BanknotesIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon, 
  EyeIcon, 
  PlusCircleIcon 
} from '@heroicons/react/24/solid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [saldo, setSaldo] = useState(0);
  const [totalReceber, setTotalReceber] = useState(0);
  const [totalPagar, setTotalPagar] = useState(0);
  const [proximosReceber, setProximosReceber] = useState(0);
  const [proximosPagar, setProximosPagar] = useState(0);
  const [jurosRecebidos, setJurosRecebidos] = useState(0);
  const [jurosPagos, setJurosPagos] = useState(0);
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
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() + 7);

    // Saldo atual (entradas - saídas)
    const { data: movimentos } = await supabase
      .from('movimentos_caixa')
      .select('valor, tipo')
      .eq('user_id', userId);

    let saldoAtual = 0;
    movimentos?.forEach(m => {
      saldoAtual += m.tipo === 'entrada' ? m.valor : -m.valor;
    });
    setSaldo(saldoAtual);

    // Total a receber/pagar
    const { data: receber } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('recebido', false);
    setTotalReceber(receber?.reduce((sum, c) => sum + c.valor_parcela, 0) || 0);

    const { data: pagar } = await supabase
      .from('contas_pagar')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('pago', false);
    setTotalPagar(pagar?.reduce((sum, c) => sum + c.valor_parcela, 0) || 0);

    // Próximos 7 dias
    const { data: proximosR } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('recebido', false)
      .gte('data_vencimento', hoje.toISOString().split('T')[0])
      .lte('data_vencimento', seteDias.toISOString().split('T')[0]);
    setProximosReceber(proximosR?.reduce((sum, c) => sum + c.valor_parcela, 0) || 0);

    const { data: proximosP } = await supabase
      .from('contas_pagar')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('pago', false)
      .gte('data_vencimento', hoje.toISOString().split('T')[0])
      .lte('data_vencimento', seteDias.toISOString().split('T')[0]);
    setProximosPagar(proximosP?.reduce((sum, c) => sum + c.valor_parcela, 0) || 0);

    // Juros mês corrente
    const mesInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const mesFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: jurosR } = await supabase
      .from('contas_receber')
      .select('juros')
      .eq('user_id', userId)
      .eq('recebido', true)
      .gte('data_recebimento', mesInicio)
      .lte('data_recebimento', mesFim);
    setJurosRecebidos(jurosR?.reduce((sum, c) => sum + (c.juros || 0), 0) || 0);

    const { data: jurosP } = await supabase
      .from('contas_pagar')
      .select('juros')
      .eq('user_id', userId)
      .eq('pago', true)
      .gte('data_pagamento', mesInicio)
      .lte('data_pagamento', mesFim);
    setJurosPagos(jurosP?.reduce((sum, c) => sum + (c.juros || 0), 0) || 0);
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen">
      <h1 className="text-5xl font-bold text-white mb-12">Dashboard</h1>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
        {/* Saldo em Caixa */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <BanknotesIcon className="h-10 w-10" />
            <span className="text-sm font-medium opacity-80">Saldo em Caixa</span>
          </div>
          <p className="text-4xl font-bold mb-6">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="grid grid-cols-3 gap-4">
            <button className="flex flex-col items-center p-3 bg-white/20 rounded-xl hover:bg-white/30 transition">
              <PlusCircleIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Entrada</span>
            </button>
            <button className="flex flex-col items-center p-3 bg-white/20 rounded-xl hover:bg-white/30 transition">
              <ArrowDownCircleIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Saída</span>
            </button>
            <button className="flex flex-col items-center p-3 bg-white/20 rounded-xl hover:bg-white/30 transition">
              <EyeIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Movimentação</span>
            </button>
          </div>
        </div>

        {/* Total a Receber */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-8 rounded-3xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <ArrowUpCircleIcon className="h-10 w-10" />
            <span className="text-sm font-medium opacity-80">Total a Receber</span>
          </div>
          <p className="text-4xl font-bold">R$ {totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm mt-2 opacity-80">Em 7 dias: R$ {proximosReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Total a Pagar */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-3xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <ArrowDownCircleIcon className="h-10 w-10" />
            <span className="text-sm font-medium opacity-80">Total a Pagar</span>
          </div>
          <p className="text-4xl font-bold">R$ {totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm mt-2 opacity-80">Em 7 dias: R$ {proximosPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* % Juros Recebidos */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 rounded-3xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <CurrencyDollarIcon className="h-10 w-10" />
            <span className="text-sm font-medium opacity-80">% Juros Recebidos</span>
          </div>
          <p className="text-4xl font-bold">{jurosRecebidos.toFixed(2)}%</p>
          <p className="text-sm mt-2 opacity-80">Mês corrente</p>
        </div>

        {/* % Juros Pagos */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-800 p-8 rounded-3xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <CurrencyDollarIcon className="h-10 w-10" />
            <span className="text-sm font-medium opacity-80">% Juros Pagos</span>
          </div>
          <p className="text-4xl font-bold">{jurosPagos.toFixed(2)}%</p>
          <p className="text-sm mt-2 opacity-80">Mês corrente</p>
        </div>
      </div>

      {/* Movimentação do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-8 rounded-3xl shadow-2xl text-white">
          <ClockIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Entradas Hoje</h3>
          <p className="text-4xl">R$ 5.200,00</p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-8 rounded-3xl shadow-2xl text-white">
          <ClockIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Saídas Hoje</h3>
          <p className="text-4xl">R$ 2.800,00</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-2xl text-white">
          <PlusCircleIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Novos a Pagar Hoje</h3>
          <p className="text-4xl">3 contas</p>
        </div>

        <div className="bg-gradient-to-br from-lime-600 to-lime-800 p-8 rounded-3xl shadow-2xl text-white">
          <PlusCircleIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Novos a Receber Hoje</h3>
          <p className="text-4xl">2 contas</p>
        </div>
      </div>

      {/* Próximos Vencimentos / Recebimentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-red-800/50">
          <div className="flex items-center mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-400 mr-4" />
            <h2 className="text-3xl font-bold text-red-400">Próximos Vencimentos (7 dias)</h2>
          </div>
          {/* Lista de itens - pode vir de API */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-xl">
              <p className="font-bold">FORNECEDOR TESTE</p>
              <p className="text-sm text-gray-400">Venc. 08/01/2026 • R$ 1.234,56</p>
            </div>
            {/* Mais itens */}
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-green-800/50">
          <div className="flex items-center mb-6">
            <CalendarIcon className="h-10 w-10 text-green-400 mr-4" />
            <h2 className="text-3xl font-bold text-green-400">Próximos Recebimentos (7 dias)</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-xl">
              <p className="font-bold">CLIENTE TESTE</p>
              <p className="text-sm text-gray-400">Venc. 09/01/2026 • R$ 2.345,67</p>
            </div>
            {/* Mais itens */}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-cyan-400 mr-3" />
            Entradas vs Saídas
          </h3>
          {/* Placeholder para gráfico */}
          <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center">
            <p className="text-gray-500">Gráfico de barras aqui (Chart.js ou Recharts)</p>
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-400 mr-3" />
            Recebimentos Mensais
          </h3>
          <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center">
            <p className="text-gray-500">Gráfico de linha aqui</p>
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-red-400 mr-3" />
            Pagamentos Mensais
          </h3>
          <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center">
            <p className="text-gray-500">Gráfico de pizza aqui</p>
          </div>
        </div>
      </div>
    </div>
  );
}