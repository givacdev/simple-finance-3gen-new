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
  const [entradasHoje, setEntradasHoje] = useState(0);
  const [saidasHoje, setSaidasHoje] = useState(0);
  const [categorias, setCategorias] = useState<{id: string, nome: string}[]>([]);
  const [proximosVencimentos, setProximosVencimentos] = useState<any[]>([]);
  const [proximosRecebimentos, setProximosRecebimentos] = useState<any[]>([]);
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalSaida, setModalSaida] = useState(false);
  const [valorLancamento, setValorLancamento] = useState('');
  const [descricaoLancamento, setDescricaoLancamento] = useState('');
  const [categoriaLancamento, setCategoriaLancamento] = useState('');
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
      loadCategorias(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadCategorias = async (userId: string) => {
    const { data } = await supabase
      .from('categorias')
      .select('id, nome')
      .eq('user_id', userId)
      .order('nome');
    setCategorias(data || []);
  };

  const loadDashboard = async (userId: string) => {
    const hojeLocal = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-');
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() + 7);
    const seteDiasLocal = seteDias.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-');

    const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-');
    const mesFim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-');

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

    // Entradas e Saídas Hoje
    const { data: hojeMov } = await supabase
      .from('movimentos_caixa')
      .select('valor, tipo')
      .eq('user_id', userId)
      .eq('data', hojeLocal);

    let entradas = 0;
    let saidas = 0;
    hojeMov?.forEach(m => {
      if (m.tipo === 'entrada') entradas += m.valor;
      else saidas += m.valor;
    });
    setEntradasHoje(entradas);
    setSaidasHoje(saidas);

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

    // Próximos 7 dias (incluindo vencidos)
    const { data: proximosR } = await supabase
      .from('contas_receber')
      .select('cliente:clientes(nome), fatura, valor_parcela, data_vencimento')
      .eq('user_id', userId)
      .eq('recebido', false)
      .lte('data_vencimento', seteDiasLocal)
      .order('data_vencimento', { ascending: true });

    setProximosReceber(proximosR?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0);
    setProximosRecebimentos(proximosR || []);

    const { data: proximosP } = await supabase
      .from('contas_pagar')
      .select('fornecedor:fornecedores(nome), fatura, valor_parcela, data_vencimento')
      .eq('user_id', userId)
      .eq('pago', false)
      .lte('data_vencimento', seteDiasLocal)
      .order('data_vencimento', { ascending: true });

    setProximosPagar(proximosP?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0);
    setProximosVencimentos(proximosP || []);

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

    // Novos hoje (timezone BRT)
    const hojeInicio = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const hojeFim = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

    const { data: novosP } = await supabase
      .from('contas_pagar')
      .select('valor_parcela')
      .eq('user_id', userId)
      .gte('created_at', hojeInicio)
      .lte('created_at', hojeFim);
    setNovosPagarHoje({
      count: novosP?.length || 0,
      valor: novosP?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0
    });

    const { data: novosR } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .gte('created_at', hojeInicio)
      .lte('created_at', hojeFim);
    setNovosReceberHoje({
      count: novosR?.length || 0,
      valor: novosR?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0
    });
  };

  const handleLancamento = async (tipo: 'entrada' | 'saida') => {
    if (!valorLancamento || Number(valorLancamento) <= 0) {
      alert('Informe um valor válido');
      return;
    }
    if (!categoriaLancamento) {
      alert('Selecione uma categoria');
      return;
    }

    const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-');

    try {
      await supabase.from('movimentos_caixa').insert({
        user_id: user.id,
        descricao: descricaoLancamento || (tipo === 'entrada' ? 'Entrada manual' : 'Saída manual'),
        valor: Number(valorLancamento),
        tipo,
        data: hoje,
        categoria: categoriaLancamento,
      });

      alert(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      setValorLancamento('');
      setDescricaoLancamento('');
      setCategoriaLancamento('');
      setModalEntrada(false);
      setModalSaida(false);
      loadDashboard(user.id);
    } catch (error: any) {
      alert('Erro ao registrar: ' + error.message);
    }
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
              onClick={() => setModalEntrada(true)}
              className="flex flex-col items-center p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
            >
              <PlusCircleIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Entrada</span>
            </button>
            <button 
              onClick={() => setModalSaida(true)}
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
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-8 rounded-3xl shadow-2xl text-white col-span-1 md:col-span-1">
          <ClockIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Entradas Hoje</h3>
          <p className="text-4xl">R$ {entradasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-8 rounded-3xl shadow-2xl text-white col-span-1 md:col-span-1">
          <ClockIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Saídas Hoje</h3>
          <p className="text-4xl">R$ {saidasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-2xl text-white col-span-1 md:col-span-1">
          <PlusCircleIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Novos a Pagar Hoje</h3>
          <p className="text-4xl">{novosPagarHoje.count} contas</p>
          <p className="text-xl mt-2">R$ {novosPagarHoje.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-gradient-to-br from-lime-600 to-lime-800 p-8 rounded-3xl shadow-2xl text-white col-span-1 md:col-span-1">
          <PlusCircleIcon className="h-12 w-12 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Novos a Receber Hoje</h3>
          <p className="text-4xl">{novosReceberHoje.count} contas</p>
          <p className="text-xl mt-2">R$ {novosReceberHoje.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Próximos Vencimentos / Recebimentos (expandido com lista real + vencidas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-red-800/50">
          <div className="flex items-center mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-400 mr-4" />
            <h2 className="text-3xl font-bold text-red-400">Próximos Vencimentos (7 dias + Vencidas)</h2>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {proximosVencimentos.map((p, index) => (
              <div key={index} className="p-4 bg-gray-800 rounded-xl">
                <p className="font-bold">{p.fornecedor?.nome || 'Sem fornecedor'}</p>
                <p className="text-sm text-gray-400">Venc. {p.data_vencimento} • R$ {p.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
            {proximosVencimentos.length === 0 && <p className="text-gray-500 text-center">Nenhum vencimento</p>}
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-green-800/50">
          <div className="flex items-center mb-6">
            <CalendarIcon className="h-10 w-10 text-green-400 mr-4" />
            <h2 className="text-3xl font-bold text-green-400">Próximos Recebimentos (7 dias + Vencidas)</h2>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {proximosRecebimentos.map((r, index) => (
              <div key={index} className="p-4 bg-gray-800 rounded-xl">
                <p className="font-bold">{r.cliente?.nome || 'Sem cliente'}</p>
                <p className="text-sm text-gray-400">Venc. {r.data_vencimento} • R$ {r.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
            {proximosRecebimentos.length === 0 && <p className="text-gray-500 text-center">Nenhum recebimento</p>}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl col-span-1 md:col-span-1">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-cyan-400 mr-3" />
            Entradas vs Saídas
          </h3>
          <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
            Gráfico de barras aqui (Chart.js ou Recharts)
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl col-span-1 md:col-span-1">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-400 mr-3" />
            Recebimentos Mensais
          </h3>
          <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
            Gráfico de linha aqui
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl col-span-1 md:col-span-1">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-red-400 mr-3" />
            Pagamentos Mensais
          </h3>
          <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
            Gráfico de pizza aqui
          </div>
        </div>
      </div>

      {/* Modais */}
      {/* ... (manter como antes, com categoria) */}
    </div>
  );
}