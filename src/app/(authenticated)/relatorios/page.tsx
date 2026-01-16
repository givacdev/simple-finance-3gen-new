'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabaseClient';

export default function Relatorios() {
  const [user, setUser] = useState<any>(null);
  const [aba, setAba] = useState<'pagar' | 'receber' | 'caixa'>('pagar');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [status, setStatus] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [resultados, setResultados] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
    };
    checkSession();
  }, [router]);

  const handleFiltrar = async () => {
    if (!user) return;

    let query

    if (aba === 'pagar') {
      query = supabase
        .from('contas_pagar')
        .select('*, fornecedores(nome)')
        .eq('user_id', user.id)
        .order('data_vencimento');

      if (status === 'pendente') query = query.eq('pago', false);
      if (status === 'pago') query = query.eq('pago', true);
    } else if (aba === 'receber') {
      query = supabase
        .from('contas_receber')
        .select('*, clientes(nome)')
        .eq('user_id', user.id)
        .order('data_vencimento');

      if (status === 'pendente') query = query.eq('recebido', false);
      if (status === 'pago') query = query.eq('recebido', true);
    } else { // caixa
      query = supabase
        .from('movimentos_caixa')
        .select('*, categorias_caixa(nome)')
        .eq('user_id', user.id)
        .order('data');
    }

    if (dataInicio) query = query.gte('data_vencimento', dataInicio); // ajusta campo pra caixa
    if (dataFim) query = query.lte('data_vencimento', dataFim);

    const { data } = await query;
    setResultados(data || []);
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8">Relatórios</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setAba('pagar')}
          className={`px-8 py-4 rounded-xl font-bold text-xl ${aba === 'pagar' ? 'bg-red-600' : 'bg-gray-700'}`}
        >
          Contas a Pagar
        </button>
        <button
          onClick={() => setAba('receber')}
          className={`px-8 py-4 rounded-xl font-bold text-xl ${aba === 'receber' ? 'bg-green-600' : 'bg-gray-700'}`}
        >
          Contas a Receber
        </button>
        <button
          onClick={() => setAba('caixa')}
          className={`px-8 py-4 rounded-xl font-bold text-xl ${aba === 'caixa' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Movimento de Caixa
        </button>
      </div>

      <div className="bg-gray-900 p-8 rounded-3xl mb-12">
        <h2 className="text-3xl font-bold mb-6">Filtros</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <label className="block text-xl mb-2">Data Inicial</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg" />
          </div>
          <div>
            <label className="block text-xl mb-2">Data Final</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg" />
          </div>
          {aba !== 'caixa' && (
            <div>
              <label className="block text-xl mb-2">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-4 bg-gray-800 rounded-lg">
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button onClick={handleFiltrar} className="w-full py-4 bg-blue-600 rounded-xl font-bold text-xl">
              Filtrar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-3xl overflow-hidden">
        <div className="p-8">
          {resultados.length === 0 ? (
            <p className="text-center text-gray-400 text-2xl py-12">Nenhum resultado encontrado</p>
          ) : (
            resultados.map((item) => (
              <div key={item.id} className="bg-gray-800 p-6 rounded-2xl mb-4">
                {/* Ajusta exibição baseado na aba */}
                <p className="text-2xl font-bold">{item.descricao || item.fatura}</p>
                <p className="text-gray-400">Data: {formatDate(item.data || item.data_vencimento)}</p>
                <p className="text-gray-500">Valor: R$ {Number(item.valor || item.valor_parcela).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}