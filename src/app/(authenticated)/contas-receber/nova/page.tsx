'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Cliente {
  id: string;
  nome: string;
  codigo: string;
}

export default function NovaContaReceber() {
  const [user, setUser] = useState<any>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [nomeNovoCliente, setNomeNovoCliente] = useState('');
  const [codigoNovoCliente, setCodigoNovoCliente] = useState('');
  const [fatura, setFatura] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [dataVencimento, setDataVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [previewParcelas, setPreviewParcelas] = useState<{ valor: number; vencimento: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadClientes(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadClientes = async (userId: string) => {
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, codigo')
      .eq('user_id', userId)
      .order('nome', { ascending: true });

    setClientes(data || []);
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(filtroCliente.toLowerCase()) ||
    c.codigo.toLowerCase().includes(filtroCliente.toLowerCase())
  );

  const handleNovoCliente = async () => {
    if (!nomeNovoCliente.trim() || !codigoNovoCliente.trim()) {
      alert('Nome e código são obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          user_id: user.id,
          nome: nomeNovoCliente.toUpperCase().trim(),
          codigo: codigoNovoCliente.toUpperCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;

      alert('Cliente cadastrado com sucesso!');
      await loadClientes(user.id);
      setClienteId(data.id);
      setModalNovoCliente(false);
      setNomeNovoCliente('');
      setCodigoNovoCliente('');
    } catch (error: any) {
      alert('Erro ao cadastrar cliente: ' + error.message);
    }
  };

  useEffect(() => {
    if (valorTotal && parcelas && dataVencimento) {
      const total = Number(valorTotal);
      const numParcelas = Number(parcelas);
      const valorBase = Math.floor((total / numParcelas) * 100) / 100;
      const centavosExtras = Math.round((total - (valorBase * numParcelas)) * 100);
      const preview = [];

      for (let i = 1; i <= numParcelas; i++) {
        let valor = valorBase;
        if (i <= centavosExtras) {
          valor += 0.01;
        }

        const [ano, mes, dia] = dataVencimento.split('-');
        let vencimento = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
        vencimento.setUTCHours(12);
        vencimento.setMonth(vencimento.getMonth() + (i - 1));
        const dataStr = vencimento.toISOString().split('T')[0];

        preview.push({ valor: Number(valor.toFixed(2)), vencimento: dataStr });
      }

      setPreviewParcelas(preview);
    } else {
      setPreviewParcelas([]);
    }
  }, [valorTotal, parcelas, dataVencimento]);

  const handleSalvar = async () => {
    if (!clienteId) {
      alert('Selecione um cliente');
      return;
    }

    if (!fatura.trim()) {
      alert('Número da fatura é obrigatório');
      return;
    }

    if (!/[a-zA-Z]/.test(fatura)) {
      alert('A fatura deve conter pelo menos uma letra (ex: REC001, BOLETO-A)');
      return;
    }

    if (!valorTotal || Number(valorTotal) <= 0) {
      alert('Informe um valor válido');
      return;
    }

    if (!dataVencimento) {
      alert('Informe a data de vencimento');
      return;
    }

    try {
      for (const [index, preview] of previewParcelas.entries()) {
        await supabase.from('contas_receber').insert({
          user_id: user.id,
          cliente_id: clienteId,
          fatura: `${fatura.toUpperCase()}-${index + 1}/${previewParcelas.length}`,
          valor_total: Number(valorTotal),
          valor_parcela: preview.valor,
          parcelas: previewParcelas.length,
          parcela_atual: index + 1,
          data_vencimento: preview.vencimento,
          recebido: false,
          observacoes: observacoes || null,
        });
      }

      alert('Conta a receber criada com sucesso!');
      router.push('/contas-receber');
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold text-green-400 mb-12">Nova Conta a Receber</h1>

      <div className="bg-gray-900 rounded-3xl p-12 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2">Cliente *</label>
            <div className="flex items-center gap-4 mb-2">
              <input
                type="text"
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                placeholder="Filtrar clientes..."
                className="flex-1 p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
              <button
                onClick={() => setModalNovoCliente(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-4 rounded-xl font-bold text-xl"
              >
                +
              </button>
            </div>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
            >
              <option value="">Selecione um cliente</option>
              {clientesFiltrados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.codigo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xl mb-2">Número da Fatura *</label>
            <input
              type="text"
              value={fatura}
              onChange={(e) => setFatura(e.target.value.toUpperCase())}
              placeholder="Ex: REC001, BOLETO-A"
              className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
            />
            <p className="text-gray-400 text-sm mt-2">
              Obrigatório conter pelo menos uma letra
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2">Valor Total (R$)</label>
            <input
              type="number"
              step="0.01"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
            />
          </div>

          <div>
            <label className="block text-xl mb-2">Parcelas</label>
            <input
              type="number"
              min="1"
              max="36"
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
              className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
            />
          </div>

          <div>
            <label className="block text-xl mb-2">1º Vencimento</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
            />
          </div>
        </div>

        {previewParcelas.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 text-green-400">Preview das Parcelas</h3>
            <div className="grid grid-cols-3 gap-4">
              {previewParcelas.map((p, index) => (
                <div key={index} className="p-4 bg-gray-800 rounded-lg">
                  <p className="font-bold">Parcela {index + 1}</p>
                  <p>Valor: R$ {p.valor.toFixed(2)}</p>
                  <p>Venc.: {p.vencimento.split('-').reverse().join('/')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-12">
          <label className="block text-xl mb-2">Observações</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={4}
            className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
            placeholder="Opcional"
          />
        </div>

        <div className="flex justify-end gap-6">
          <button
            onClick={() => router.push('/contas-receber')}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xl"
          >
            Salvar Conta
          </button>
        </div>
      </div>

      {modalNovoCliente && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalNovoCliente(false)}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">Novo Cliente</h2>
            
            <div className="mb-4">
              <label className="block text-xl mb-2">Nome *</label>
              <input
                value={nomeNovoCliente}
                onChange={(e) => setNomeNovoCliente(e.target.value)}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xl mb-2">Código (4 caracteres) *</label>
              <input
                value={codigoNovoCliente}
                onChange={(e) => setCodigoNovoCliente(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
            </div>

            <div className="flex justify-end gap-6">
              <button
                onClick={() => setModalNovoCliente(false)}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleNovoCliente}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xl"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}