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
  const [jurosRecebidosValor, setJurosRecebidosValor] = useState(0);
  const [jurosRecebidosPerc, setJurosRecebidosPerc] = useState(0);
  const [jurosPagosValor, setJurosPagosValor] = useState(0);
  const [jurosPagosPerc, setJurosPagosPerc] = useState(0);
  const [novosPagarHoje, setNovosPagarHoje] = useState({ count: 0, valor: 0 });
  const [novosReceberHoje, setNovosReceberHoje] = useState({ count: 0, valor: 0 });
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
    const hoje = new Date().toISOString().split('T')[0];
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() + 7);
    const seteDiasStr = seteDias.toISOString().split('T')[0];

    const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const mesFim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    // Saldo atual
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
    setTotalReceber(receber?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0);

    const { data: pagar } = await supabase
      .from('contas_pagar')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('pago', false);
    setTotalPagar(pagar?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0);

    // Próximos 7 dias
    const { data: proximosR } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('recebido', false)
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', seteDiasStr);
    setProximosReceber(proximosR?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0);

    const { data: proximosP } = await supabase
      .from('contas_pagar')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('pago', false)
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', seteDiasStr);
    setProximosPagar(proximosP?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0);

    // Juros mês corrente + %
    const { data: jurosR } = await supabase
      .from('contas_receber')
      .select('juros, valor_parcela')
      .eq('user_id', userId)
      .eq('recebido', true)
      .gte('data_recebimento', mesInicio)
      .lte('data_recebimento', mesFim);

    let totalRecebidoMes = jurosR?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0;
    let jurosRecebidos = jurosR?.reduce((sum, c) => sum + (c.juros || 0), 0) || 0;
    setJurosRecebidosValor(jurosRecebidos);
    setJurosRecebidosPerc(totalRecebidoMes > 0 ? (jurosRecebidos / totalRecebidoMes) * 100 : 0);

    const { data: jurosP } = await supabase
      .from('contas_pagar')
      .select('juros, valor_parcela')
      .eq('user_id', userId)
      .eq('pago', true)
      .gte('data_pagamento', mesInicio)
      .lte('data_pagamento', mesFim);

    let totalPagoMes = jurosP?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0;
    let jurosPagos = jurosP?.reduce((sum, c) => sum + (c.juros || 0), 0) || 0;
    setJurosPagosValor(jurosPagos);
    setJurosPagosPerc(totalPagoMes > 0 ? (jurosPagos / totalPagoMes) * 100 : 0);

    // Novos hoje
    const { data: novosP } = await supabase
      .from('contas_pagar')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('created_at', hoje); // Supondo que tem created_at na tabela
    setNovosPagarHoje({
      count: novosP?.length || 0,
      valor: novosP?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0
    });

    const { data: novosR } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('created_at', hoje);
    setNovosReceberHoje({
      count: novosR?.length || 0,
      valor: novosR?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0
    });
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
            <button 
              onClick={() => router.push('/caixa/nova-entrada')}
              className="flex flex-col items-center p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
            >
              <PlusCircleIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Entrada</span>
            </button>
            <button 
              onClick={() => router.push('/caixa/nova-saida')}
              className="flex flex-col items-center p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
            >
              <ArrowDownCircleIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Saída</span>
            </button>
            <button 
              onClick={() => router.push('/movimentos-caixa')}
              className="flex flex-col items-center p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
            >
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

        {/* Juros Recebidos */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 rounded-3xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <CurrencyDollarIcon className="h-10 w-10" />
            <span className="text-sm font-medium opacity-80">Juros Recebidos</span>
          </div>
          <p className="text-4xl font-bold">R$ {jurosRecebidosValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm mt-2 opacity-80">{jurosRecebidosPerc.toFixed(2)}% do total recebido no mês</p>
        </div>

        {/* Juros Pagos */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-800 p-8 rounded-3xl shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <CurrencyDollarIcon className="h-10 w-10" />
            <span className="text-sm font-medium opacity-80">Juros Pagos</span>
          </div>
          <p className="text-4xl font-bold">R$ {jurosPagosValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm mt-2 opacity-80">{jurosPagosPerc.toFixed(2)}% do total pago no mês</p>
        </div>
      </div>

      {/* Movimentação do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-8 rounded-3xl shadow-2xl text-white">
          <ClockIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Entradas Hoje</h3>
          <p className="text-4xl">R$ 5.200,00</p> {/* Placeholder - puxar real depois */}
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-8 rounded-3xl shadow-2xl text-white">
          <ClockIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Saídas Hoje</h3>
          <p className="text-4xl">R$ 2.800,00</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-2xl text-white">
          <PlusCircleIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Novos a Pagar Hoje</h3>
          <p className="text-4xl">{novosPagarHoje.count} contas</p>
          <p className="text-xl mt-2">R$ {novosPagarHoje.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-gradient-to-br from-lime-600 to-lime-800 p-8 rounded-3xl shadow-2xl text-white">
          <PlusCircleIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Novos a Receber Hoje</h3>
          <p className="text-4xl">{novosReceberHoje.count} contas</p>
          <p className="text-xl mt-2">R$ {novosReceberHoje.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Próximos Vencimentos / Recebimentos */}
      {/* ... (manter como estava ou expandir com lista real) */}

      {/* Gráficos */}
      {/* ... (placeholders - podemos implementar depois com Chart.js) */}
    </div>
  );
}