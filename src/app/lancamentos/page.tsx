'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Lancamentos() {
  const [user, setUser] = useState<any>(null);
  const [tipo, setTipo] = useState<'pagar' | 'receber'>('pagar');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadLancamentos(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadLancamentos = async (userId: string) => {
    const table = tipo === 'pagar' ? 'contas_pagar' : 'contas_receber';
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('data_vencimento', { ascending: true });
    setLancamentos(data || []);
  };

  const addLancamento = async () => {
    if (!descricao || !valor || !data) return;
    const table = tipo === 'pagar' ? 'contas_pagar' : 'contas_receber';
    await supabase.from(table).insert({
      user_id: user.id,
      descricao,
      vl_parcela: Number(valor),
      data_vencimento: data,
    });
    setDescricao('');
    setValor('');
    setData('');
    loadLancamentos(user.id);
  };

  const deleteLancamento = async (id: string) => {
    const table = tipo === 'pagar' ? 'contas_pagar' : 'contas_receber';
    await supabase.from(table).delete().eq('id', id);
    loadLancamentos(user.id);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Lançamentos Financeiros</h1>

        <div className="bg-gray-900 p-8 rounded-2xl mb-12">
          <div className="flex gap-6 mb-8">
            <button onClick={() => { setTipo('pagar'); loadLancamentos(user.id); }} className={`px-8 py-4 rounded-xl font-bold ${tipo === 'pagar' ? 'bg-red-600' : 'bg-gray-700'}`}>
              Contas a Pagar
            </button>
            <button onClick={() => { setTipo('receber'); loadLancamentos(user.id); }} className={`px-8 py-4 rounded-xl font-bold ${tipo === 'receber' ? 'bg-green-600' : 'bg-gray-700'}`}>
              Contas a Receber
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="p-4 bg-gray-800 rounded-lg" />
            <input type="number" placeholder="Valor (R$)" value={valor} onChange={(e) => setValor(e.target.value)} className="p-4 bg-gray-800 rounded-lg" />
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="p-4 bg-gray-800 rounded-lg" />
          </div>
          <button onClick={addLancamento} className="mt-6 bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-xl font-bold text-xl">
            Adicionar Lançamento
          </button>
        </div>

        <div className="grid gap-6">
          {lancamentos.length === 0 ? (
            <p className="text-center text-gray-400 text-2xl">Nenhum lançamento ainda. Comece adicionando acima!</p>
          ) : (
            lancamentos.map((l) => (
              <div key={l.id} className="bg-gray-900 p-6 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">{l.descricao}</p>
                  <p className="text-xl text-gray-400">
                    R$ {Number(l.vl_parcela).toFixed(2)} - Vencimento: {new Date(l.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button onClick={() => deleteLancamento(l.id)} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold">
                  Excluir
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
