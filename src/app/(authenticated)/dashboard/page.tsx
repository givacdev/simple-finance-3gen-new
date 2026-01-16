'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [saldoCaixa, setSaldoCaixa] = useState(0);
  const [totalReceber, setTotalReceber] = useState(0);
  const [totalPagar, setTotalPagar] = useState(0);
  const [jurosRecebidos, setJurosRecebidos] = useState(0);
  const [jurosPagos, setJurosPagos] = useState(0);
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

    // Total a Receber e Pagar (simplificado, sem juros por enquanto)
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

    // Entradas e Saídas Hoje
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white pl-0 lg:pl-64 p-6 lg:p-12">
      <h1 className="text-4xl lg:text-5xl font-bold mb-10">Dashboard</h1>

      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        {/* Card principal Saldo em Caixa - grande, quadrado, premium */}
        <div className="w-full lg:w-1/3 aspect-square bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-8 lg:p-12 text-center border border-blue-800/50 shadow-2xl flex flex-col justify-between transition-all hover:shadow-blue-900/50">
          <div>
            <p className="text-2xl lg:text-3xl font-semibold mb-4 text-blue-300">Saldo em Caixa</p>
            <p className={`text-5xl lg:text-7xl font-bold mb-8 tracking-tight ${
              saldoCaixa >= 0 ? 'text-white' : 'text-red-400'
            }`}>
              R$ {saldoCaixa.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
            <button 
              onClick={() => alert('Modal de Entrada - em desenvolvimento')} 
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-green-600/50"
            >
              Entrada
            </button>
            <button 
              onClick={() => alert('Modal de Saída - em desenvolvimento')} 
              className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-red-600/50"
            >
              Saída
            </button>
            <button 
              onClick={() => router.push('/lancamentos')} 
              className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-gray-600/50"
            >
              Movimentação
            </button>
          </div>
        </div>

        {/* Cards menores - 2 linhas de 4 */}
        <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-950 to-green-900 p-6 rounded-3xl text-center border border-green-800/50 shadow-lg hover:shadow-green-600/30 transition-all">
            <p className="text-xl mb-2 text-green-300">Total a Receber</p>
            <p className="text-4xl font-bold text-white">R$ {totalReceber.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-950 to-red-900 p-6 rounded-3xl text-center border border-red-800/50 shadow-lg hover:shadow-red-600/30 transition-all">
            <p className="text-xl mb-2 text-red-300">Total a Pagar</p>
            <p className="text-4xl font-bold text-white">R$ {totalPagar.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-teal-950 to-teal-900 p-6 rounded-3xl text-center border border-teal-800/50 shadow-lg hover:shadow-teal-600/30 transition-all">
            <p className="text-xl mb-2 text-teal-300">Juros Recebidos</p>
            <p className="text-4xl font-bold text-white">R$ {jurosRecebidos.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-950 to-purple-900 p-6 rounded-3xl text-center border border-purple-800/50 shadow-lg hover:shadow-purple-600/30 transition-all">
            <p className="text-xl mb-2 text-purple-300">Juros Pagos</p>
            <p className="text-4xl font-bold text-white">R$ {jurosPagos.toFixed(2)}</p>
          </div>

          {/* Segunda linha */}
          <div className="bg-gradient-to-br from-teal-950 to-teal-900 p-6 rounded-3xl text-center border border-teal-800/50 shadow-lg hover:shadow-teal-600/30 transition-all">
            <p className="text-xl mb-2 text-teal-300">Entradas Hoje</p>
            <p className="text-3xl font-bold text-white">R$ {entradasHoje.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-950 to-orange-900 p-6 rounded-3xl text-center border border-orange-800/50 shadow-lg hover:shadow-orange-600/30 transition-all">
            <p className="text-xl mb-2 text-orange-300">Saídas Hoje</p>
            <p className="text-3xl font-bold text-white">R$ {saidasHoje.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-950 to-purple-900 p-6 rounded-3xl text-center border border-purple-800/50 shadow-lg hover:shadow-purple-600/30 transition-all">
            <p className="text-xl mb-2 text-purple-300">Novos a Pagar Hoje</p>
            <p className="text-3xl font-bold text-white">0 contas</p>
          </div>
          <div className="bg-gradient-to-br from-green-950 to-green-900 p-6 rounded-3xl text-center border border-green-800/50 shadow-lg hover:shadow-green-600/30 transition-all">
            <p className="text-xl mb-2 text-green-300">Novos a Receber Hoje</p>
            <p className="text-3xl font-bold text-white">0 contas</p>
          </div>
        </div>
      </div>
    </div>
  );
}