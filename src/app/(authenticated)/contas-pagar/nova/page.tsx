'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Fornecedor {
  id: string;
  nome: string;
  codigo: string;
}

export default function NovaContaPagar() {
  const [user, setUser] = useState<any>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [modalNovoFornecedor, setModalNovoFornecedor] = useState(false);
  const [nomeNovoFornecedor, setNomeNovoFornecedor] = useState('');
  const [codigoNovoFornecedor, setCodigoNovoFornecedor] = useState('');
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
      loadFornecedores(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadFornecedores = async (userId: string) => {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome, codigo')
      .eq('user_id', userId)
      .order('nome', { ascending: true });

    setFornecedores(data || []);
  };

  const fornecedoresFiltrados = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(filtroFornecedor.toLowerCase()) ||
    f.codigo.toLowerCase().includes(filtroFornecedor.toLowerCase())
  );

  const handleNovoFornecedor = async () => {
    if (!nomeNovoFornecedor.trim() || !codigoNovoFornecedor.trim()) {
      alert('Nome e código são obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({
          user_id: user.id,
          nome: nomeNovoFornecedor.toUpperCase().trim(),
          codigo: codigoNovoFornecedor.toUpperCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;

      alert('Fornecedor cadastrado com sucesso!');
      await loadFornecedores(user.id);
      setFornecedorId(data.id);
      setModalNovoFornecedor(false);
      setNomeNovoFornecedor('');
      setCodigoNovoFornecedor('');
    } catch (error: any) {
      alert('Erro ao cadastrar fornecedor: ' + error.message);
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
    if (!fornecedorId) {
      alert('Selecione um fornecedor');
      return;
    }

    if (!fatura.trim()) {
      alert('Número da fatura é obrigatório');
      return;
    }

    if (!/[a-zA-Z]/.test(fatura)) {
      alert('A fatura deve conter pelo menos uma letra (ex: PAG001, BOLETO-A)');
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
      previewParcelas.forEach(async (preview, i) => {
        await supabase.from('contas_pagar').insert({
          user_id: user.id,
          fornecedor_id: fornecedorId,
          fatura: `${fatura.toUpperCase()}-${i+1}/${previewParcelas.length}`,
          valor_total: Number(valorTotal),
          valor_parcela: preview.valor,
          parcelas: previewParcelas.length,
          parcela_atual: i + 1,
          data_vencimento: preview.vencimento,
          pago: false,
          observacoes: observacoes || null,
        });
      });

      alert('Conta a pagar criada com sucesso!');
      router.push('/contas-pagar');
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold text-red-400 mb-12">Nova Conta a Pagar</h1>

      <div className="bg-gray-900 rounded-3xl p-12 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2">Fornecedor *</label>
            <div className="flex items-center gap-4 mb-2">
              <input
                type="text"
                value={filtroFornecedor}
                onChange={(e) => setFiltroFornecedor(e.target.value)}
                placeholder="Filtrar fornecedores..."
                className="flex-1 p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
              <button
                onClick={() => setModalNovoFornecedor(true)}
                className="bg-red-600 hover:bg-red-700 px-4 py-4 rounded-xl font-bold text-xl"
              >
                +
              </button>
            </div>
            <select
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
              className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
            >
              <option value="">Selecione um fornecedor</option>
              {fornecedoresFiltrados.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} ({f.codigo})
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
              placeholder="Ex: PAG001, BOLETO-A"
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
            <h3 className="text-2xl font-bold mb-4 text-red-400">Preview das Parcelas</h3>
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
            onClick={() => router.push('/contas-pagar')}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xl"
          >
            Salvar Conta
          </button>
        </div>
      </div>

      {modalNovoFornecedor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalNovoFornecedor(false)}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-red-400 mb-6 text-center">Novo Fornecedor</h2>
            
            <div className="mb-4">
              <label className="block text-xl mb-2">Nome *</label>
              <input
                value={nomeNovoFornecedor}
                onChange={(e) => setNomeNovoFornecedor(e.target.value)}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xl mb-2">Código (4 caracteres) *</label>
              <input
                value={codigoNovoFornecedor}
                onChange={(e) => setCodigoNovoFornecedor(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
            </div>

            <div className="flex justify-end gap-6">
              <button
                onClick={() => setModalNovoFornecedor(false)}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleNovoFornecedor}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xl"
              >
                Salvar Fornecedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}