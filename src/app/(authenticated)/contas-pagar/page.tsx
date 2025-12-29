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

    try {
      // 1. Busca a conta
      const { data: conta } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('id', contaId)
        .single();

      // 2. Cria lançamento no caixa (categoria "Pagamentos")
      const { data: cat } = await supabase
        .from('categorias_caixa')
        .select('id')
        .or('nome.eq.Pagamentos,padrao.eq.true')
        .limit(1)
        .single();

      const { data: movimento } = await supabase.from('movimentos_caixa').insert({
        user_id: user.id,
        descricao: `Pagamento - Fatura #${conta.fatura} - ${conta.fornecedores.nome}`,
        valor: conta.valor_parcela,
        tipo: 'saida',
        categoria_id: cat.id,
        data: new Date().toISOString().split('T')[0],
      }).select().single();

      // 3. Atualiza a conta como paga
      const { error } = await supabase
        .from('contas_pagar')
        .update({
          pago: true,
          data_baixa: new Date().toISOString().split('T')[0],
          movimento_caixa_id: movimento.id
        })
        .eq('id', contaId);

      if (error) throw error;

      loadContas(user.id);
      alert('Pagamento registrado com sucesso!');
    } catch (error: any) {
      alert('Erro ao pagar: ' + error.message);
    }
  };

  const isVencida = (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(dataVencimento + 'T12:00:00');
    return venc < hoje;
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
          <input placeholder="Buscar por fornecedor, fatura ou observação..." className="w-full p-4 bg-gray-800 rounded-lg" />
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
                    <p className="text-gray-400 mt-2">Fatura #{conta.fatura} • Valor Total: R$ {Number(conta.valor_total).toFixed(2)}</p>
                    <p className="text-gray-500">Obs: {conta.observacoes || 'Sem observações'}</p>
                  </div>
                  {isVencida(conta.data_vencimento) && (
                    <span className="text-yellow-500 font-bold text-xl">Vencido</span>
                  )}
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <div>
                    <p>PARCELA {conta.parcela_atual}/{conta.parcelas}</p>
                    <p className="text-gray-400">
                      VENCIMENTO {new Date(conta.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
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