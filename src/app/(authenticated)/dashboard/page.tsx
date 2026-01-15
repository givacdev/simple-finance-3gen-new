'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [saldoCaixa, setSaldoCaixa] = useState(0);
  const [totalReceber, setTotalReceber] = useState(0);
  const [totalPagar, setTotalPagar] = useState(0);
  const [jurosRecebidos, setJurosRecebidos] = useState(0);
  const [jurosPagos, setJurosPagos] = useState(0);
  const [totalRecebido30Dias, setTotalRecebido30Dias] = useState(0);
  const [totalPago30Dias, setTotalPago30Dias] = useState(0);
  const [contasPagarProximas, setContasPagarProximas] = useState<any[]>([]);
  const [contasReceberProximas, setContasReceberProximas] = useState<any[]>([]);
  const [novosPagarHoje, setNovosPagarHoje] = useState(0);
  const [novosReceberHoje, setNovosReceberHoje] = useState(0);
  const [entradasHoje, setEntradasHoje] = useState(0);
  const [saidasHoje, setSaidasHoje] = useState(0);

  // Modais
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalSaida, setModalSaida] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
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
    // ... (todo o loadDashboardData igual ao anterior, mantendo juros %, novos hoje, etc.)
  };

  const handleSalvarMovimento = async (tipo: 'entrada' | 'saida') => {
    if (!descricao.trim() || !valor || Number(valor) <= 0 || !categoria) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const hoje = DateTime.local().setZone('America/Sao_Paulo').toISODate();

    const { error } = await supabase.from('movimentos_caixa').insert({
      user_id: user.id,
      descricao,
      valor: Number(valor),
      tipo,
      data: hoje,
      categoria,
    });

    if (error) {
      alert('Erro ao salvar: ' + error.message);
      return;
    }

    alert(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
    setModalEntrada(false);
    setModalSaida(false);
    setDescricao('');
    setValor('');
    setCategoria('');
    loadDashboardData(user.id); // Recarrega dados
  };

  const formatDate = (iso: string) => {
    return DateTime.fromISO(iso, { zone: 'America/Sao_Paulo' }).toFormat('dd/MM/yyyy');
  };

  // ... (percentJurosRecebidos e percentJurosPagos iguais)

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white pl-0 lg:pl-64 p-6 lg:p-12">
      <h1 className="text-5xl font-bold mb-12">Dashboard</h1>

      {/* Cards principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Card Saldo em Caixa - grande */}
        <div className="bg-blue-900/50 backdrop-blur-md rounded-3xl p-8 text-center border border-blue-700/30 row-span-2 flex flex-col justify-between min-h-[400px]">
          <div>
            <p className="text-2xl mb-4">Saldo em Caixa</p>
            <p className="text-6xl font-bold mb-8">R$ {saldoCaixa.toFixed(2)}</p>
          </div>
          <div className="flex justify-center gap-6 flex-wrap">
            <button 
              onClick={() => setModalEntrada(true)} 
              className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-xl font-bold text-lg"
            >
              Entrada
            </button>
            <button 
              onClick={() => setModalSaida(true)} 
              className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl font-bold text-lg"
            >
              Saída
            </button>
            <button 
              onClick={() => router.push('/movimentos')} 
              className="bg-gray-600 hover:bg-gray-700 px-6 py-4 rounded-xl font-bold text-lg"
            >
              Movimentação
            </button>
          </div>
        </div>

        {/* Outros cards */}
        {/* ... (mantém igual ao anterior) */}
      </div>

      {/* Modais de Entrada e Saída */}
      {modalEntrada && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setModalEntrada(false)}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-green-400 mb-6">Nova Entrada</h2>
            <div className="mb-4">
              <label className="block text-xl mb-2">Descrição *</label>
              <input
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
                placeholder="Ex: Venda do dia"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xl mb-2">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
            </div>
            <div className="mb-6">
              <label className="block text-xl mb-2">Categoria *</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              >
                <option value="">Selecione</option>
                <option value="Vendas">Vendas</option>
                <option value="Serviços">Serviços</option>
                <option value="Outras">Outras</option>
              </select>
            </div>
            <div className="flex justify-end gap-6">
              <button onClick={() => setModalEntrada(false)} className="px-8 py-4 bg-gray-700 rounded-xl font-bold text-xl">
                Cancelar
              </button>
              <button onClick={() => handleSalvarMovimento('entrada')} className="px-8 py-4 bg-green-600 rounded-xl font-bold text-xl">
                Salvar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {modalSaida && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setModalSaida(false)}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-red-400 mb-6">Nova Saída</h2>
            {/* Mesmos campos do modal Entrada */}
            {/* ... (copia os inputs do modal Entrada aqui) */}
            <div className="flex justify-end gap-6">
              <button onClick={() => setModalSaida(false)} className="px-8 py-4 bg-gray-700 rounded-xl font-bold text-xl">
                Cancelar
              </button>
              <button onClick={() => handleSalvarMovimento('saida')} className="px-8 py-4 bg-red-600 rounded-xl font-bold text-xl">
                Salvar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ... resto do dashboard igual */}
    </div>
  );
}