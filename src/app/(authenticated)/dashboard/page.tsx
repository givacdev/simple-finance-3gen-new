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
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalSaida, setModalSaida] = useState(false);
  const [valorLancamento, setValorLancamento] = useState('');
  const [descricaoLancamento, setDescricaoLancamento] = useState('');
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

    // Entradas e Saídas Hoje
    const { data: hojeMov } = await supabase
      .from('movimentos_caixa')
      .select('valor, tipo')
      .eq('user_id', userId)
      .eq('data', hoje);

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
      .gte('created_at', hoje + ' 00:00:00')
      .lt('created_at', hoje + ' 23:59:59');
    setNovosPagarHoje({
      count: novosP?.length || 0,
      valor: novosP?.reduce((sum, c) => sum + (c.valor_parcela || 0), 0) || 0
    });

    const { data: novosR } = await supabase
      .from('contas_receber')
      .select('valor_parcela')
      .eq('user_id', userId)
      .gte('created_at', hoje + ' 00:00:00')
      .lt('created_at', hoje + ' 23:59:59');
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

    const hoje = new Date().toISOString().split('T')[0];

    try {
      await supabase.from('movimentos_caixa').insert({
        user_id: user.id,
        descricao: descricaoLancamento || (tipo === 'entrada' ? 'Entrada manual' : 'Saída manual'),
        valor: Number(valorLancamento),
        tipo,
        data: hoje,
      });

      alert(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      setValorLancamento('');
      setDescricaoLancamento('');
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

        {/* ... (manter os outros cards como estavam, com as atualizações de juros %) */}
      </div>

      {/* Modais de Entrada / Saída */}
      {(modalEntrada || modalSaida) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => { setModalEntrada(false); setModalSaida(false); }}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              {modalEntrada ? 'Nova Entrada no Caixa' : 'Nova Saída no Caixa'}
            </h2>

            <div className="mb-6">
              <label className="block text-xl mb-2">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valorLancamento}
                onChange={(e) => setValorLancamento(e.target.value)}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
                placeholder="0.00"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xl mb-2">Descrição</label>
              <input
                type="text"
                value={descricaoLancamento}
                onChange={(e) => setDescricaoLancamento(e.target.value)}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
                placeholder="Ex: Venda, pagamento fornecedor..."
              />
            </div>

            <div className="flex justify-end gap-6">
              <button
                onClick={() => { setModalEntrada(false); setModalSaida(false); }}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleLancamento(modalEntrada ? 'entrada' : 'saida')}
                className={`px-8 py-4 rounded-xl font-bold text-xl ${modalEntrada ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Confirmar {modalEntrada ? 'Entrada' : 'Saída'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ... (restante do dashboard como antes) */}
    </div>
  );
}