'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NovaContaPagar() {
  const [user, setUser] = useState<any>(null);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [fornecedorId, setFornecedorId] = useState('');
  const [fatura, setFatura] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [tipoParcelamento, setTipoParcelamento] = useState<'fixo' | 'manual'>('fixo');
  const [intervaloDias, setIntervaloDias] = useState('30');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else {
        setUser(data.session.user);
        loadFornecedores(data.session.user.id);
      }
    };
    checkSession();
  }, [router]);

  const loadFornecedores = async (userId: string) => {
    const { data } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('user_id', userId)
      .order('nome');
    setFornecedores(data || []);
  };

  const calcularParcelas = () => {
    const total = Number(valorTotal);
    const numParcelas = Number(parcelas);
    const valorBase = Math.floor(total / numParcelas * 100) / 100;
    const resto = Number((total - valorBase * numParcelas).toFixed(2));
    const parcelasValores = [];
    for (let i = 0; i < numParcelas; i++) {
      let valor = valorBase;
      if (i < resto * 100) valor += 0.01;
      parcelasValores.push(valor.toFixed(2));
    }
    return parcelasValores;
  };

  const handleSubmit = async () => {
    if (!fornecedorId || !valorTotal || !parcelas || !primeiroVencimento) return;

    const parcelasValores = calcularParcelas();
    const numParcelas = Number(parcelas);
    let dataVenc = new Date(primeiroVencimento);

    for (let i = 0; i < numParcelas; i++) {
      await supabase.from('contas_pagar').insert({
        user_id: user.id,
        fornecedor_id: fornecedorId,
        fatura,
        valor_total: Number(valorTotal),
        parcelas: numParcelas,
        parcela_atual: i + 1,
        valor_parcela: Number(parcelasValores[i]),
        data_vencimento: dataVenc.toISOString().split('T')[0],
        observacoes,
      });

      if (tipoParcelamento === 'fixo') {
        dataVenc.setDate(dataVenc.getDate() + Number(intervaloDias));
      } else {
        // manual – tu vai implementar depois
      }
    }

    router.push('/contas-pagar');
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8">Nova Conta a Pagar</h1>

      <div className="bg-gray-900 p-10 rounded-2xl max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-xl mb-2">Fornecedor *</label>
            <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg">
              <option value="">Selecione um fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome} ({f.codigo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xl mb-2">Número da Fatura</label>
            <input value={fatura} onChange={(e) => setFatura(e.target.value)} placeholder="Ex: INV-001" className="w-full p-4 bg-gray-800 rounded-lg" />
          </div>

          <div>
            <label className="block text-xl mb-2">Valor Total (R$)*</label>
            <input type="number" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg" />
          </div>

          <div>
            <label className="block text-xl mb-2">Número de Parcelas *</label>
            <input type="number" value={parcelas} onChange={(e) => setParcelas(e.target.value)} min="1" className="w-full p-4 bg-gray-800 rounded-lg" />
          </div>

          {Number(parcelas) > 1 && (
            <>
              <div>
                <label className="block text-xl mb-2">Tipo de Parcelamento</label>
                <div className="flex gap-8">
                  <label>
                    <input type="radio" checked={tipoParcelamento === 'fixo'} onChange={() => setTipoParcelamento('fixo')} />
                    Fixo
                  </label>
                  <label>
                    <input type="radio" checked={tipoParcelamento === 'manual'} onChange={() => setTipoParcelamento('manual')} />
                    Manual
                  </label>
                </div>
              </div>

              {tipoParcelamento === 'fixo' && (
                <>
                  <div>
                    <label className="block text-xl mb-2">Intervalo de dias</label>
                    <input type="number" value={intervaloDias} onChange={(e) => setIntervaloDias(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg" />
                  </div>

                  <div>
                    <label className="block text-xl mb-2">Primeiro Vencimento *</label>
                    <input type="date" value={primeiroVencimento} onChange={(e) => setPrimeiroVencimento(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg" />
                  </div>
                </>
              )}
            </>
          )}

          <div className="md:col-span-2">
            <label className="block text-xl mb-2">Observações</label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg" rows={4} />
          </div>
        </div>

        <div className="flex justify-end gap-6 mt-12">
          <button onClick={() => router.back()} className="px-8 py-4 rounded-xl font-bold text-xl">Cancelar</button>
          <button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-xl">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}