'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Conta {
  id: string;
  fornecedor_id?: string;
  fornecedor?: { nome: string };
  fatura: string;
  valor_total: number;
  valor_parcela: number;
  parcela_atual: number;
  parcelas: number;
  data_vencimento: string;
  pago: boolean;
  data_pagamento?: string;
  juros?: number;
  observacoes?: string;
}

export default function ContasPagar() {
  const [user, setUser] = useState<any>(null);
  const [contasPendentes, setContasPendentes] = useState<Conta[]>([]);
  const [busca, setBusca] = useState('');
  const [modalPagamento, setModalPagamento] = useState<Conta | null>(null);
  const [valorJuros, setValorJuros] = useState('0');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadContasPendentes(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadContasPendentes = async (userId: string) => {
    const { data } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(nome)')
      .eq('user_id', userId)
      .eq('pago', false)
      .order('data_vencimento', { ascending: true });

    setContasPendentes(data || []);
  };

  const contasFiltradas = contasPendentes.filter(conta => {
    const termo = busca.toLowerCase();
    return (
      conta.fornecedor?.nome?.toLowerCase().includes(termo) ||
      conta.fatura?.toLowerCase().includes(termo) ||
      conta.observacoes?.toLowerCase().includes(termo)
    );
  });

  const handlePagar = async () => {
    if (!modalPagamento) return;

    const hoje = new Date().toISOString().split('T')[0];
    const juros = estaVencida(modalPagamento.data_vencimento) ? Number(valorJuros || 0) : 0;
    const valorFinal = Number(modalPagamento.valor_parcela) + juros;

    try {
      const { error } = await supabase
        .from('contas_pagar')
        .update({
          pago: true,
          data_pagamento: hoje,
          juros: juros,
        })
        .eq('id', modalPagamento.id);

      if (error) throw error;

      await supabase.from('movimentos_caixa').insert({
        user_id: user.id,
        descricao: `Pagamento: ${modalPagamento.fatura} - ${modalPagamento.fornecedor?.nome || ''}`,
        valor: valorFinal,
        tipo: 'saida',
        data: hoje,
      });

      alert('Conta paga e registrada no caixa com sucesso!');
      setModalPagamento(null);
      setValorJuros('0');
      loadContasPendentes(user!.id);
    } catch (error: any) {
      alert('Erro ao pagar conta: ' + error.message);
    }
  };

  const estaVencida = (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    return vencimento < hoje;
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold text-red-400">Contas a Pagar</h1>
        <button 
          onClick={() => router.push('/contas-pagar/nova')}
          className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-xl"
        >
          + Nova Conta a Pagar
        </button>
      </div>

      <div className="mb-8">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por fornecedor, fatura ou observação..."
          className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
        />
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {contasFiltradas.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">
              {contasPendentes.length === 0 ? 'Nenhuma conta a pagar pendente.' : 'Nenhuma conta encontrada com o filtro.'}
            </p>
          ) : (
            contasFiltradas.map((conta) => (
              <div key={conta.id} className="p-8 hover:bg-gray-800 transition flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{conta.fornecedor?.nome || 'Sem fornecedor'}</p>
                  <p className="text-gray-400 mt-2">
                    Fatura #{conta.fatura} • Valor Total: R$ {Number(conta.valor_total).toFixed(2)}
                  </p>
                  {conta.observacoes && <p className="text-gray-500">Obs: {conta.observacoes}</p>}
                  <p className="mt-2">
                    PARCELA {conta.parcela_atual}/{conta.parcelas}
                    {' • '}
                    VENCIMENTO {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                    {estaVencida(conta.data_vencimento) && <span className="text-red-400 ml-4 font-bold">VENCIDA</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-red-400">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  <button 
                    onClick={() => setModalPagamento(conta)}
                    className="mt-4 bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-xl"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modalPagamento && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalPagamento(null)}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-red-400 mb-6 text-center">Pagar Conta</h2>
            
            <p className="text-xl mb-4">
              <strong>Fornecedor:</strong> {modalPagamento.fornecedor?.nome}
            </p>
            <p className="text-xl mb-4">
              <strong>Fatura:</strong> #{modalPagamento.fatura}
            </p>
            <p className="text-xl mb-6">
              <strong>Valor da parcela:</strong> R$ {Number(modalPagamento.valor_parcela).toFixed(2)}
            </p>

            {estaVencida(modalPagamento.data_vencimento) && (
              <div className="mb-6">
                <label className="block text-xl mb-2">Juros/Multa (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorJuros}
                  onChange={(e) => setValorJuros(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
                />
                <p className="text-red-400 text-sm mt-2">
                  Conta vencida em {new Date(modalPagamento.data_vencimento).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-6">
              <button
                onClick={() => setModalPagamento(null)}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handlePagar}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xl"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}