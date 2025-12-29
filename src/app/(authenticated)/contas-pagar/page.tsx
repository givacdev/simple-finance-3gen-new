'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ContasPagar() {
  const [user, setUser] = useState<any>(null);
  const [contas, setContas] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadContas(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadContas = async (userId: string) => {
    const { data } = await supabase
      .from('contas_pagar')
      .select('*, fornecedores(nome)')
      .eq('user_id', userId)
      .eq('pago', false) // só pendentes
      .order('data_vencimento', { ascending: true });
    setContas(data || []);
  };

  const handlePagar = async (contaId: string) => {
    if (!confirm('Confirmar pagamento desta parcela?')) return;

    // Modal simples pra informar juros
    const jurosStr = prompt('Juros pagos (se houver, senão deixe 0):', '0');
    const juros = jurosStr ? parseFloat(jurosStr.replace(',', '.')) : 0;
    if (isNaN(juros) || juros < 0) {
      alert('Valor de juros inválido');
      return;
    }

    try {
      const { data: conta } = await supabase
        .from('contas_pagar')
        .select('*, fornecedores(nome)')
        .eq('id', contaId)
        .single();

      const valorTotalPago = conta.valor_parcela + juros;

      // Busca categoria "Pagamentos"
      const { data: catData } = await supabase
        .from('categorias_caixa')
        .select('id')
        .or('nome.eq.Pagamentos,padrao.eq.true')
        .limit(1)
        .single();

      const categoriaId = catData?.id || null;

      // Cria movimento no caixa com valor total (incluindo juros)
      const { data: movimento } = await supabase
        .from('movimentos_caixa')
        .insert({
          user_id: user.id,
          descricao: `Pagamento - Fatura #${conta.fatura} - ${conta.fornecedores.nome}${juros > 0 ? ` (com R$${juros.toFixed(2)} de juros)` : ''}`,
          valor: valorTotalPago,
          tipo: 'saida',
          categoria_id: categoriaId,
          data: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      // Atualiza a conta
      await supabase
        .from('contas_pagar')
        .update({
          pago: true,
          data_baixa: new Date().toISOString().split('T')[0],
          movimento_caixa_id: movimento.id,
          juros_pagos: juros,
          valor_total_pago: valorTotalPago,
        })
        .eq('id', contaId);

      loadContas(user.id);
      alert('Pagamento registrado com sucesso!');
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const isVencida = (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(dataVencimento + 'T12:00:00');
    return venc < hoje;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-bold flex items-center gap-4">
            <span className="text-red-500">🔴</span> Contas a Pagar
          </h1>
          <p className="text-xl text-gray-400 mt-2">Gerencie suas obrigações financeiras</p>
        </div>
        <Link href="/contas-pagar/nova">
          <button className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-xl">
            + Nova Conta a Pagar
          </button>
        </Link>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <input 
            placeholder="Buscar por fornecedor, fatura ou observação..." 
            className="w-full p-4 bg-gray-800 rounded-lg" 
          />
        </div>

        <div className="divide-y divide-gray-800">
          {contas.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">Nenhuma conta a pagar pendente.</p>
          ) : (
            contas.map((conta) => (
              <div key={conta.id} className="p-8 hover:bg-gray-800 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-bold">{conta.fornecedores?.nome || 'Sem fornecedor'}</p>
                    <p className="text-gray-400 mt-2">
                      Fatura #{conta.fatura} • Valor Total: R$ {Number(conta.valor_total).toFixed(2)}
                    </p>
                    <p className="text-gray-500">Obs: {conta.observacoes || 'Sem observações'}</p>
                  </div>
                    {isVencida(conta.data_vencimento) && (
                    <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold">VENCIDO</span>
                  )}
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <div>
                    <p>PARCELA {conta.parcela_atual}/{conta.parcelas}</p>
                    <p className="text-gray-400">VENCIMENTO {formatDate(conta.data_vencimento)}</p>
                  </div>
                  <div className="text-3xl font-bold">R$ {Number(conta.valor_parcela).toFixed(2)}</div>
                  <button
                    onClick={() => handlePagar(conta.id)}
                    className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}