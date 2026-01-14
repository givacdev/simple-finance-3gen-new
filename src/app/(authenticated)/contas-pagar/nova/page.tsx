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
  const [filtro, setFiltro] = useState('');
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [codigoNovo, setCodigoNovo] = useState('');
  const [fatura, setFatura] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [intervaloDias, setIntervaloDias] = useState('30'); // Novo campo: intervalo de dias entre parcelas
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
    f.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    f.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleNovoFornecedor = async () => {
    if (!nomeNovo.trim() || !codigoNovo.trim()) {
      alert('Nome e código são obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({
          user_id: user.id,
          nome: nomeNovo.toUpperCase().trim(),
          codigo: codigoNovo.toUpperCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;

      alert('Fornecedor cadastrado com sucesso!');
      await loadFornecedores(user.id);
      setFornecedorSelecionado(data);
      setFiltro(data.nome + ' (' + data.codigo + ')');
      setModalNovo(false);
      setNomeNovo('');
      setCodigoNovo('');
    } catch (error: any) {
      alert('Erro ao cadastrar fornecedor: ' + error.message);
    }
  };

  useEffect(() => {
    if (valorTotal && parcelas && dataVencimento && intervaloDias && fornecedorSelecionado) {
      const total = Number(valorTotal);
      const numParcelas = Number(parcelas);
      const interval = Number(intervaloDias);
      const valorBase = Math.floor((total / numParcelas) * 100) / 100;
      const centavosExtras = Math.round((total - (valorBase * numParcelas)) * 100);
      const preview = [];

      for (let i = 1; i <= numParcelas; i++) {
        let valor = valorBase;
        if (i <= centavosExtras) {
          valor += 0.01;
        }

        // Preview usa Date local para mostrar correto
        const [ano, mes, dia] = dataVencimento.split('-');
        const baseDate = new Date(Number(ano), Number(mes) - 1, Number(dia));
        baseDate.setDate(baseDate.getDate() + (interval * (i - 1)));
        const dataStr = baseDate.toISOString().split('T')[0];

        preview.push({ valor: Number(valor.toFixed(2)), vencimento: dataStr });
      }

      setPreviewParcelas(preview);
    } else {
      setPreviewParcelas([]);
    }
  }, [valorTotal, parcelas, intervaloDias, dataVencimento, fornecedorSelecionado]);

  const handleSalvar = async () => {
    if (!fornecedorSelecionado) {
      alert('Selecione um fornecedor');
      return;
    }

    if (!fatura.trim()) {
      alert('Número da fatura é obrigatório');
      return;
    }

    if (!/[a-zA-Z]/.test(fatura)) {
      alert('A fatura deve conter pelo menos uma letra');
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

    if (!intervaloDias || Number(intervaloDias) <= 0) {
      alert('Informe um intervalo válido');
      return;
    }

    try {
      for (const [index, p] of previewParcelas.entries()) {
        // Data em string pura - com ajuste de timezone BRT (UTC-3)
        const [ano, mes, dia] = dataVencimento.split('-');
        const baseDate = new Date(Number(ano), Number(mes) - 1, Number(dia));
        baseDate.setDate(baseDate.getDate() + (Number(intervaloDias) * index));
        baseDate.setHours(3, 0, 0, 0); // Adiciona +3h pra compensar BRT → UTC

        const anoV = baseDate.getUTCFullYear();
        const mesV = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
        const diaV = String(baseDate.getUTCDate()).padStart(2, '0');
        const dataVencStr = `${anoV}-${mesV}-${diaV}`;

        await supabase.from('contas_pagar').insert({
          user_id: user.id,
          fornecedor_id: fornecedorSelecionado.id,
          fatura: `${fatura.toUpperCase()}-${index + 1}/${previewParcelas.length}`,
          valor_total: Number(valorTotal),
          valor_parcela: p.valor,
          parcelas: previewParcelas.length,
          parcela_atual: index + 1,
          data_vencimento: dataVencStr,
          pago: false,
          observacoes: observacoes || null,
        });
      }

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
            <div className="relative">
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Digite para filtrar ou selecione..."
                className="w-full p-4 pr-12 bg-gray-800 rounded-lg text-white text-xl"
              />
              <button
                onClick={() => setModalNovo(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold"
              >
                +
              </button>
            </div>
            {filtro && fornecedoresFiltrados.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-gray-800 rounded-lg">
                {fornecedoresFiltrados.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setFornecedorSelecionado(f);
                      setFiltro(`${f.nome} (${f.codigo})`);
                    }}
                    className="p-3 hover:bg-gray-700 cursor-pointer"
                  >
                    {f.nome} ({f.codigo})
                  </div>
                ))}
              </div>
            )}
            {fornecedorSelecionado && filtro === '' && (
              <p className="mt-2 text-red-400">Selecionado: {fornecedorSelecionado.nome} ({fornecedorSelecionado.codigo})</p>
            )}
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

        <div className="grid md:grid-cols-4 gap-8 mb-8">
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
            <label className="block text-xl mb-2">Intervalo de Dias</label>
            <input
              type="number"
              min="1"
              value={intervaloDias}
              onChange={(e) => setIntervaloDias(e.target.value)}
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

      {modalNovo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalNovo(false)}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-red-400 mb-6 text-center">Novo Fornecedor</h2>
            
            <div className="mb-4">
              <label className="block text-xl mb-2">Nome *</label>
              <input
                value={nomeNovo}
                onChange={(e) => setNomeNovo(e.target.value)}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xl mb-2">Código (4 caracteres) *</label>
              <input
                value={codigoNovo}
                onChange={(e) => setCodigoNovo(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              />
            </div>

            <div className="flex justify-end gap-6">
              <button
                onClick={() => setModalNovo(false)}
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