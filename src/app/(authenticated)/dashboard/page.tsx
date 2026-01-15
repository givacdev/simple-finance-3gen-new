'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [saldoCaixa, setSaldoCaixa] = useState(0);
  const [totalReceber, setTotalReceber] = useState(0);
  const [totalPagar, setTotalPagar] = useState(0);
  const [jurosRecebidos, setJurosRecebidos] = useState(0);
  const [jurosPagos, setJurosPagos] = useState(0);
  const [totalRecebido30Dias, setTotalRecebido30Dias] = useState(0);
  const [totalPago30Dias, setTotalPago30Dias] = useState(0);
  const [contasPagarProximas, setContasPagarProximas] = useState<any[]>([]);
  const [contasReceberProximas, setContasReceberProximas] = useState<any[]>([]);
  const [novosPagarHoje, setNovosPagarHoje] = useState(0);
  const [novosReceberHoje, setNovosReceberHoje] = useState(0);
  const [entradasHoje, setEntradasHoje] = useState(0);
  const [saidasHoje, setSaidasHoje] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadDashboardData(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadDashboardData = async (userId: string) => {
    const hoje = DateTime.local().setZone('America/Sao_Paulo');
    const hojeInicio = hoje.startOf('day').toISO();
    const hojeFim = hoje.endOf('day').toISO();
    const seteDias = hoje.plus({ days: 7 }).endOf('day').toISO();
    const trintaDiasAtras = hoje.minus({ days: 30 }).startOf('day').toISO();

    // Saldo Caixa
    const { data: movimentos } = await supabase
      .from('movimentos_caixa')
      .select('valor, tipo')
      .eq('user_id', userId);
    let saldo = 0;
    movimentos?.forEach(m => {
      saldo += m.tipo === 'entrada' ? m.valor : -m.valor;
    });
    setSaldoCaixa(saldo);

    // Total a Receber e Pagar
    const { data: pagar } = await supabase
      .from('contas_pagar')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('pago', false);
    setTotalPagar(pagar?.reduce((acc, c) => acc + (c.valor_parcela || 0), 0) || 0);

    const { data: receber } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('recebido', false);
    setTotalReceber(receber?.reduce((acc, c) => acc + (c.valor_parcela || 0), 0) || 0);

    // Juros e % últimos 30 dias
    const { data: pagarPagos30 } = await supabase
      .from('contas_pagar')
      .select('juros, valor_parcela')
      .eq('user_id', userId)
      .eq('pago', true)
      .gte('data_pagamento', trintaDiasAtras);
    const jurosP = pagarPagos30?.reduce((acc, c) => acc + (c.juros || 0), 0) || 0;
    const totalP = pagarPagos30?.reduce((acc, c) => acc + (c.valor_parcela || 0), 0) || 0;
    setJurosPagos(jurosP);
    setTotalPago30Dias(totalP);

    const { data: receberRecebidos30 } = await supabase
      .from('contas_receber')
      .select('juros, valor_parcela')
      .eq('user_id', userId)
      .eq('recebido', true)
      .gte('data_recebimento', trintaDiasAtras);
    const jurosR = receberRecebidos30?.reduce((acc, c) => acc + (c.juros || 0), 0) || 0;
    const totalR = receberRecebidos30?.reduce((acc, c) => acc + (c.valor_parcela || 0), 0) || 0;
    setJurosRecebidos(jurosR);
    setTotalRecebido30Dias(totalR);

    // Próximos Vencimentos
    const { data: pagarProximas } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(nome)')
      .eq('user_id', userId)
      .eq('pago', false)
      .lte('data_vencimento', seteDias)
      .order('data_vencimento', { ascending: true });
    setContasPagarProximas(pagarProximas || []);

    // Próximos Recebimentos
    const { data: receberProximas } = await supabase
      .from('contas_receber')
      .select('*, cliente:clientes(nome)')
      .eq('user_id', userId)
      .eq('recebido', false)
      .lte('data_vencimento', seteDias)
      .order('data_vencimento', { ascending: true });
    setContasReceberProximas(receberProximas || []);

    // Novos Hoje
    const { count: novosP } = await supabase
      .from('contas_pagar')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', hojeInicio)
      .lte('created_at', hojeFim);
    setNovosPagarHoje(novosP || 0);

    const { count: novosR } = await supabase
      .from('contas_receber')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', hojeInicio)
      .lte('created_at', hojeFim);
    setNovosReceberHoje(novosR || 0);

    // Entradas/Saídas Hoje
    const { data: movHoje } = await supabase
      .from('movimentos_caixa')
      .select('valor, tipo')
      .eq('user_id', userId)
      .gte('data', hojeInicio)
      .lte('data', hojeFim);
    let entradas = 0, saidas = 0;
    movHoje?.forEach(m => {
      if (m.tipo === 'entrada') entradas += m.valor;
      else saidas += m.valor;
    });
    setEntradasHoje(entradas);
    setSaidasHoje(saidas);
  };

  const formatDate = (iso: string) => {
    return DateTime.fromISO(iso, { zone: 'America/Sao_Paulo' }).toFormat('dd/MM/yyyy');
  };

  const percentJurosRecebidos = totalRecebido30Dias > 0 ? ((jurosRecebidos / totalRecebido30Dias) * 100).toFixed(1) : 0;
  const percentJurosPagos = totalPago30Dias > 0 ? ((jurosPagos / totalPago30Dias) * 100).toFixed(1) : 0;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white pl-0 lg:pl-64 p-6 lg:p-12">
      <h1 className="text-5xl font-bold mb-12">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Card Saldo em Caixa - maior, quadrado */}
        <div className="bg-blue-900/50 backdrop-blur-md rounded-3xl p-8 text-center border border-blue-700/30 row-span-2 flex flex-col justify-between min-h-[400px]">
          <div>
            <p className="text-2xl mb-4">Saldo em Caixa</p>
            <p className="text-6xl font-bold mb-8">R$ {saldoCaixa.toFixed(2)}</p>
          </div>
          <div className="flex justify-center gap-6 flex-wrap">
            <button 
              onClick={() => alert('Modal de Entrada - em breve!')} 
              className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-xl font-bold text-lg"
            >
              Entrada
            </button>
            <button 
              onClick={() => alert('Modal de Saída - em breve!')} 
              className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl font-bold text-lg"
            >
              Saída
            </button>
            <button 
              onClick={() => router.push('/movimentos')} 
              className="bg-gray-600 hover:bg-gray-700 px-6 py-4 rounded-xl font-bold text-lg"
            >
              Movimentação
            </button>
          </div>
        </div>

        {/* Outros cards */}
        <div className="bg-green-900/50 backdrop-blur-md rounded-3xl p-6 text-center border border-green-700/30">
          <p className="text-xl mb-2">Total a Receber</p>
          <p className="text-4xl font-bold">R$ {totalReceber.toFixed(2)}</p>
        </div>
        <div className="bg-red-900/50 backdrop-blur-md rounded-3xl p-6 text-center border border-red-700/30">
          <p className="text-xl mb-2">Total a Pagar</p>
          <p className="text-4xl font-bold">R$ {totalPagar.toFixed(2)}</p>
        </div>
        <div className="bg-teal-900/50 backdrop-blur-md rounded-3xl p-6 text-center border border-teal-700/30">
          <p className="text-xl mb-2">Juros Recebidos</p>
          <p className="text-4xl font-bold">R$ {jurosRecebidos.toFixed(2)}</p>
          <p className="text-sm text-gray-300 mt-1">{percentJurosRecebidos}% do total recebido nos últimos 30 dias</p>
        </div>
        <div className="bg-purple-900/50 backdrop-blur-md rounded-3xl p-6 text-center border border-purple-700/30">
          <p className="text-xl mb-2">Juros Pagos</p>
          <p className="text-4xl font-bold">R$ {jurosPagos.toFixed(2)}</p>
          <p className="text-sm text-gray-300 mt-1">{percentJurosPagos}% do total pago nos últimos 30 dias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-teal-900/50 backdrop-blur-md rounded-3xl p-6 text-center border border-teal-700/30">
          <p className="text-xl mb-2">Entradas Hoje</p>
          <p className="text-3xl font-bold">R$ {entradasHoje.toFixed(2)}</p>
        </div>
        <div className="bg-orange-900/50 backdrop-blur-md rounded-3xl p-6 text-center border border-orange-700/30">
          <p className="text-xl mb-2">Saídas Hoje</p>
          <p className="text-3xl font-bold">R$ {saidasHoje.toFixed(2)}</p>
        </div>
        <div className="bg-purple-900/50 backdrop-blur-md rounded-3xl p-6 text-center border border-purple-700/30">
          <p className="text-xl mb-2">Novos a Pagar Hoje</p>
          <p className="text-3xl font-bold">{novosPagarHoje} contas</p>
        </div>
        <div className="bg-green-900/50 backdrop-blur-md rounded-3xl p-6 text-center border border-green-700/30">
          <p className="text-xl mb-2">Novos a Receber Hoje</p>
          <p className="text-3xl font-bold">{novosReceberHoje} contas</p>
        </div>
      </div>

      {/* Cards Próximos */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl p-8 border border-gray-700/50">
          <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
            <span className="mr-3 text-3xl">⚠️</span> Próximos Vencimentos (7 dias + Vencidas)
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {contasPagarProximas.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum vencimento próximo.</p>
            ) : (
              contasPagarProximas.map((conta) => (
                <div key={conta.id} className="p-5 bg-gray-800/70 rounded-xl flex justify-between items-center border border-red-900/30 hover:border-red-600/50 transition">
                  <div>
                    <p className="font-bold text-lg">{conta.fornecedor?.nome || 'Sem fornecedor'}</p>
                    <p className="text-sm text-gray-300 mt-1">Vencimento: {formatDate(conta.data_vencimento)}</p>
                    <p className="text-sm text-red-400 font-medium mt-1">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  </div>
                  <button onClick={() => router.push('/contas-pagar')} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold text-sm transition">
                    Pagar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl p-8 border border-gray-700/50">
          <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
            <span className="mr-3 text-3xl">📅</span> Próximos Recebimentos (7 dias + Vencidos)
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {contasReceberProximas.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum recebimento próximo.</p>
            ) : (
              contasReceberProximas.map((conta) => (
                <div key={conta.id} className="p-5 bg-gray-800/70 rounded-xl flex justify-between items-center border border-green-900/30 hover:border-green-600/50 transition">
                  <div>
                    <p className="font-bold text-lg">{conta.cliente?.nome || 'Sem cliente'}</p>
                    <p className="text-sm text-gray-300 mt-1">Vencimento: {formatDate(conta.data_vencimento)}</p>
                    <p className="text-sm text-green-400 font-medium mt-1">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  </div>
                  <button onClick={() => router.push('/contas-receber')} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-sm transition">
                    Receber
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl p-8 h-96 border border-gray-700/50">Gráfico Entradas vs Saídas</div>
        <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl p-8 h-96 border border-gray-700/50">Gráfico Recebimentos Mensais</div>
        <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl p-8 h-96 border border-gray-700/50">Gráfico Pagamentos Mensais</div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return DateTime.fromISO(iso, { zone: 'America/Sao_Paulo' }).toFormat('dd/MM/yyyy');
}