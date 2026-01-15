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
  const [contasPagarProximas, setContasPagarProximas] = useState<any[]>([]);
  const [contasReceberProximas, setContasReceberProximas] = useState<any[]>([]);
  const [novosPagarHoje, setNovosPagarHoje] = useState(0);
  const [novosReceberHoje, setNovosReceberHoje] = useState(0);
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
    const hoje = DateTime.local().startOf('day').toISO();
    const seteDias = DateTime.local().plus({ days: 7 }).endOf('day').toISO();

    // Saldo Caixa (exemplo simples - soma entradas - saídas)
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
    setTotalPagar(pagar?.reduce((acc, c) => acc + c.valor_parcela, 0) || 0);

    const { data: receber } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .eq('recebido', false);
    setTotalReceber(receber?.reduce((acc, c) => acc + c.valor_parcela, 0) || 0);

    // Juros (exemplo - soma de juros pagos/recebidos)
    const { data: jurosPagosData } = await supabase
      .from('contas_pagar')
      .select('juros')
      .eq('user_id', userId)
      .eq('pago', true);
    setJurosPagos(jurosPagosData?.reduce((acc, c) => acc + (c.juros || 0), 0) || 0);

    const { data: jurosRecebidosData } = await supabase
      .from('contas_receber')
      .select('juros')
      .eq('user_id', userId)
      .eq('recebido', true);
    setJurosRecebidos(jurosRecebidosData?.reduce((acc, c) => acc + (c.juros || 0), 0) || 0);

    // Próximos Vencimentos (7 dias + vencidas)
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
    const hojeInicio = DateTime.local().startOf('day').toISO();
    const hojeFim = DateTime.local().endOf('day').toISO();

    const { count: novosPagar } = await supabase
      .from('contas_pagar')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', hojeInicio)
      .lte('created_at', hojeFim);
    setNovosPagarHoje(novosPagar || 0);

    const { count: novosReceber } = await supabase
      .from('contas_receber')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', hojeInicio)
      .lte('created_at', hojeFim);
    setNovosReceberHoje(novosReceber || 0);
  };

  const formatDate = (iso: string) => {
    return DateTime.fromISO(iso, { zone: 'America/Sao_Paulo' }).toFormat('dd/MM/yyyy');
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold text-white mb-12">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
        <div className="bg-blue-900 rounded-3xl p-6 text-center">
          <p className="text-xl mb-2">Saldo em Caixa</p>
          <p className="text-4xl font-bold">R$ {saldoCaixa.toFixed(2)}</p>
        </div>
        <div className="bg-green-900 rounded-3xl p-6 text-center">
          <p className="text-xl mb-2">Total a Receber</p>
          <p className="text-4xl font-bold">R$ {totalReceber.toFixed(2)}</p>
        </div>
        <div className="bg-red-900 rounded-3xl p-6 text-center">
          <p className="text-xl mb-2">Total a Pagar</p>
          <p className="text-4xl font-bold">R$ {totalPagar.toFixed(2)}</p>
        </div>
        <div className="bg-teal-900 rounded-3xl p-6 text-center">
          <p className="text-xl mb-2">Juros Recebidos</p>
          <p className="text-4xl font-bold">R$ {jurosRecebidos.toFixed(2)}</p>
        </div>
        <div className="bg-purple-900 rounded-3xl p-6 text-center">
          <p className="text-xl mb-2">Juros Pagos</p>
          <p className="text-4xl font-bold">R$ {jurosPagos.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-teal-800 rounded-3xl p-6">
          <p className="text-xl mb-2">Entradas Hoje</p>
          <p className="text-3xl font-bold">R$ 77,50</p> {/* Placeholder - atualize com query real */}
        </div>
        <div className="bg-orange-800 rounded-3xl p-6">
          <p className="text-xl mb-2">Saídas Hoje</p>
          <p className="text-3xl font-bold">R$ 0,00</p>
        </div>
        <div className="bg-purple-800 rounded-3xl p-6">
          <p className="text-xl mb-2">Novos a Pagar Hoje</p>
          <p className="text-3xl font-bold">{novosPagarHoje} contas</p>
          <p className="text-sm">R$ 0,00</p>
        </div>
        <div className="bg-green-800 rounded-3xl p-6">
          <p className="text-xl mb-2">Novos a Receber Hoje</p>
          <p className="text-3xl font-bold">{novosReceberHoje} contas</p>
          <p className="text-sm">R$ 0,00</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-900 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
            <span className="mr-2">⚠️</span> Próximos Vencimentos (7 dias + Vencidas)
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {contasPagarProximas.length === 0 ? (
              <p className="text-gray-400 text-center">Nenhum vencimento próximo.</p>
            ) : (
              contasPagarProximas.map((conta) => (
                <div key={conta.id} className="p-4 bg-gray-800 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold">{conta.fornecedor?.nome || 'Sem fornecedor'}</p>
                    <p className="text-sm text-gray-400">Vencimento: {formatDate(conta.data_vencimento)}</p>
                    <p className="text-sm text-red-400">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold text-sm">
                    Pagar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center">
            <span className="mr-2">📅</span> Próximos Recebimentos (7 dias + Vencidos)
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {contasReceberProximas.length === 0 ? (
              <p className="text-gray-400 text-center">Nenhum recebimento próximo.</p>
            ) : (
              contasReceberProximas.map((conta) => (
                <div key={conta.id} className="p-4 bg-gray-800 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold">{conta.cliente?.nome || 'Sem cliente'}</p>
                    <p className="text-sm text-gray-400">Vencimento: {formatDate(conta.data_vencimento)}</p>
                    <p className="text-sm text-green-400">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  </div>
                  <button className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-sm">
                    Receber
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gráficos placeholder */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-gray-900 rounded-3xl p-8 h-96">Gráfico Entradas vs Saídas</div>
        <div className="bg-gray-900 rounded-3xl p-8 h-96">Gráfico Recebimentos Mensais</div>
        <div className="bg-gray-900 rounded-3xl p-8 h-96">Gráfico Pagamentos Mensais</div>
      </div>
    </div>
  );
}