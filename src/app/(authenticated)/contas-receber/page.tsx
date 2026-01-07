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
  cliente_id?: string;
  cliente?: { nome: string };
  fatura: string;
  valor_total: number;
  valor_parcela: number;
  parcela_atual: number;
  parcelas: number;
  data_vencimento: string;
  recebido: boolean;
  data_recebimento?: string;
  juros?: number;
  observacoes?: string;
}

export default function ContasReceber() {
  const [user, setUser] = useState<any>(null);
  const [contasPendentes, setContasPendentes] = useState<Conta[]>([]);
  const [busca, setBusca] = useState('');
  const [modalRecebimento, setModalRecebimento] = useState<Conta | null>(null);
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
      .from('contas_receber')
      .select('*, cliente:clientes(nome)')
      .eq('user_id', userId)
      .eq('recebido', false)
      .order('data_vencimento', { ascending: true });

    setContasPendentes(data || []);
  };

  const contasFiltradas = contasPendentes.filter(conta => {
    const termo = busca.toLowerCase();
    return (
      conta.cliente?.nome?.toLowerCase().includes(termo) ||
      conta.fatura?.toLowerCase().includes(termo) ||
      conta.observacoes?.toLowerCase().includes(termo)
    );
  });

  const handleReceber = async () => {
    if (!modalRecebimento) return;

    const hoje = new Date().toISOString().split('T')[0];
    const juros = estaVencida(modalRecebimento.data_vencimento) ? Number(valorJuros || 0) : 0;
    const valorFinal = Number(modalRecebimento.valor_parcela) + juros;

    try {
      const { error } = await supabase
        .from('contas_receber')
        .update({
          recebido: true,
          data_recebimento: hoje,
          juros: juros,
        })
        .eq('id', modalRecebimento.id);

      if (error) throw error;

      await supabase.from('movimentos_caixa').insert({
        user_id: user.id,
        descricao: `Recebimento: ${modalRecebimento.fatura} - ${modalRecebimento.cliente?.nome || ''}`,
        valor: valorFinal,
        tipo: 'entrada',
        data: hoje,
      });

      alert('Conta recebida e registrada no caixa com sucesso!');
      setModalRecebimento(null);
      setValorJuros('0');
      loadContasPendentes(user!.id);
    } catch (error: any) {
      alert('Erro ao receber conta: ' + error.message);
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
        <h1 className="text-5xl font-bold text-green-400">Contas a Receber</h1>
        <button 
          onClick={() => router.push('/contas-receber/nova')}
          className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-bold text-xl"
        >
          + Nova Conta a Receber
        </button>
      </div>

      <div className="mb-8">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente, fatura ou observação..."
          className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
        />
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {contasFiltradas.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">
              {contasPendentes.length === 0 ? 'Nenhuma conta a receber pendente.' : 'Nenhuma conta encontrada com o filtro.'}
            </p>
          ) : (
            contasFiltradas.map((conta) => (
              <div key={conta.id} className="p-8 hover:bg-gray-800 transition flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{conta.cliente?.nome || 'Sem cliente'}</p>
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
                  <p className="text-4xl font-bold text-green-400">R$ {Number(conta.valor_parcela).toFixed(2)}</p>
                  <button 
                    onClick={() => setModalRecebimento(conta)}
                    className="mt-4 bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-bold text-xl"
                  >
                    Receber
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modalRecebimento && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalRecebimento(null)}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">Receber Conta</h2>
            
            <p className="text-xl mb-4">
              <strong>Cliente:</strong> {modalRecebimento.cliente?.nome}
            </p>
            <p className="text-xl mb-4">
              <strong>Fatura:</strong> #{modalRecebimento.fatura}
            </p>
            <p className="text-xl mb-6">
              <strong>Valor da parcela:</strong> R$ {Number(modalRecebimento.valor_parcela).toFixed(2)}
            </p>

            {estaVencida(modalRecebimento.data_vencimento) && (
              <div className="mb-6">
                <label className="block text-xl mb-2">Juros (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorJuros}
                  onChange={(e) => setValorJuros(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
                />
                <p className="text-red-400 text-sm mt-2">
                  Conta vencida em {new Date(modalRecebimento.data_vencimento).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-6">
              <button
                onClick={() => setModalRecebimento(null)}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleReceber}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xl"
              >
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}