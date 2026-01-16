'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [saldoCaixa, setSaldoCaixa] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchSaldo = async () => {
      const { data: movimentos } = await supabase
        .from('movimentos_caixa')
        .select('valor, tipo')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      let saldo = 0;
      movimentos?.forEach(m => {
        saldo += m.tipo === 'entrada' ? m.valor : -m.valor;
      });
      setSaldoCaixa(saldo);
    };
    fetchSaldo();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-12">
      <h1 className="text-4xl lg:text-5xl font-bold mb-12">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-green-900/50 p-6 rounded-3xl text-center">
            <p className="text-xl">Total a Receber</p>
            <p className="text-4xl font-bold">R$ 1150.66</p>
          </div>
          <div className="bg-red-900/50 p-6 rounded-3xl text-center">
            <p className="text-xl">Total a Pagar</p>
            <p className="text-4xl font-bold">R$ 3218.30</p>
          </div>
          <div className="bg-teal-900/50 p-6 rounded-3xl text-center">
            <p className="text-xl">Juros Recebidos</p>
            <p className="text-4xl font-bold">R$ 22.50</p>
          </div>
          <div className="bg-purple-900/50 p-6 rounded-3xl text-center">
            <p className="text-xl">Juros Pagos</p>
            <p className="text-4xl font-bold">R$ 32.50</p>
          </div>
        </div>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Saldo grande e quadrado */}
        <div className="w-full lg:w-1/3 aspect-square bg-blue-900 rounded-3xl p-8 flex flex-col justify-center text-center">
          <p className="text-3xl mb-4">Saldo em Caixa</p>
          <p className="text-6xl font-bold">R$ {saldoCaixa.toFixed(2)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button className="bg-green-600 px-6 py-3 rounded-lg" onClick={() => alert('Entrada')}>
              Entrada
            </button>
            <button className="bg-red-600 px-6 py-3 rounded-lg" onClick={() => alert('Saída')}>
              Saída
            </button>
            <button className="bg-gray-600 px-6 py-3 rounded-lg" onClick={() => router.push('/lancamentos')}>
              Movimentação
            </button>
          </div>
        </div>

        {/* Cards simples ao lado */}
        <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-green-900 p-6 rounded-3xl text-center">
            <p className="text-xl">Total a Receber</p>
            <p className="text-4xl font-bold">R$ 1150.66</p>
          </div>
          <div className="bg-red-900 p-6 rounded-3xl text-center">
            <p className="text-xl">Total a Pagar</p>
            <p className="text-4xl font-bold">R$ 3218.30</p>
          </div>
          {/* Adicione os outros cards conforme precisar */}
        </div>
      </div>
    </div>
  );
}