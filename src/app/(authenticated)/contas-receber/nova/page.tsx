'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabaseClient';

interface Cliente {
  id: string;
  nome: string;
  codigo: string;
}

interface Categoria {
  id: string;
  nome: string;
}

interface PreviewParcela {
  valor: number;
  vencimento: string;
}

export default function NovaContaReceber() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtro, setFiltro] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [modalNovo, setModalNovo] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [codigoNovo, setCodigoNovo] = useState('');
  const [fatura, setFatura] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [intervaloDias, setIntervaloDias] = useState('30');
  const [dataVencimento, setDataVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [previewParcelas, setPreviewParcelas] = useState<PreviewParcela[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      console.log('User ID:', data.session.user.id);
      await loadClientes(data.session.user.id);
      await loadCategorias(data.session.user.id);
      setLoading(false);
    };
    checkSession();
  }, [router]);

  const loadClientes = async (userId: string) => {
    const { data } = await supabase
      .from('clientes')
      .select('id, nome, codigo')
      .eq('user_id', userId)
      .order('nome');
    setClientes(data || []);
  };

  const loadCategorias = async (userId: string) => {
    const { data } = await supabase
      .from('categorias')
      .select('id, nome')
      .eq('user_id', userId)
      .eq('tipo', 'receita') // Só receitas para contas a receber!
      .order('nome');
    setCategorias(data || []);
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    c.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleNovoCliente = async () => {
    if (!nomeNovo.trim() || !codigoNovo.trim()) {
      alert('Nome e código são obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          user_id: user.id,
          nome: nomeNovo.toUpperCase().trim(),
          codigo: codigoNovo.toUpperCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;

      alert('Cliente cadastrado com sucesso!');
      await loadClientes(user.id);
      setClienteSelecionado(data);
      setFiltro(`${data.nome} (${data.codigo})`);
      setModalNovo(false);
      setNomeNovo('');
      setCodigoNovo('');
    } catch (error: any) {
      alert('Erro ao cadastrar cliente: ' + error.message);
    }
  };

  useEffect(() => {
    if (valorTotal && parcelas && dataVencimento && intervaloDias && clienteSelecionado) {
      const total = Number(valorTotal);
      const numParcelas = Number(parcelas);
      const interval = Number(intervaloDias);
      const valorBase = Math.floor((total / numParcelas) * 100) / 100;
      const centavosExtras = Math.round((total - (valorBase * numParcelas)) * 100);
      const preview: PreviewParcela[] = [];

      for (let i = 1; i <= numParcelas; i++) {
        let valor = valorBase;
        if (i <= centavosExtras) valor += 0.01;

        const dt = DateTime.fromISO(dataVencimento, { zone: 'America/Sao_Paulo' })
          .plus({ days: interval * (i - 1) })
          .set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

        preview.push({
          valor: Number(valor.toFixed(2)),
          vencimento: dt.toISODate() ?? 'Data inválida'
        });
      }

      setPreviewParcelas(preview);
    } else {
      setPreviewParcelas([]);
    }
  }, [valorTotal, parcelas, intervaloDias, dataVencimento, clienteSelecionado]);

  const handleSalvar = async () => {
    if (!clienteSelecionado) return alert('Selecione um cliente');
    if (!categoriaSelecionada) return alert('Selecione uma categoria');
    if (!fatura.trim()) return alert('Número da fatura obrigatório');
    if (!/[a-zA-Z]/.test(fatura)) return alert('Fatura deve ter pelo menos uma letra');
    if (!valorTotal || Number(valorTotal) <= 0) return alert('Valor válido obrigatório');
    if (!dataVencimento) return alert('Data de vencimento obrigatória');
    if (!intervaloDias || Number(intervaloDias) <= 0) return alert('Intervalo válido obrigatório');

    try {
      console.log('Iniciando salvamento com user_id:', user.id);

      for (const [index, p] of previewParcelas.entries()) {
        const dt = DateTime.fromISO(dataVencimento, { zone: 'America/Sao_Paulo' })
          .plus({ days: Number(intervaloDias) * index })
          .set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

        const dataVencISO = dt.toISO();

        console.log(`Parcela ${index + 1} - ISO salvo: ${dataVencISO}`);

        const { error } = await supabase.from('contas_receber').insert({
          user_id: user.id,
          cliente_id: clienteSelecionado.id,
          fatura: `${fatura.toUpperCase()}-${index + 1}/${previewParcelas.length}`,
          valor_total: Number(valorTotal),
          valor_parcela: p.valor,
          parcelas: previewParcelas.length,
          parcela_atual: index + 1,
          data_vencimento: dataVencISO,
          recebido: false,
          categoria: categoriaSelecionada,
          observacoes: observacoes || null,
        });

        if (error) {
          console.error('Erro na parcela', index + 1, ':', error);
          throw error;
        }
      }

      alert('Conta a receber criada com sucesso!');
      router.push('/contas-receber');
    } catch (error: any) {
      console.error('Erro completo ao salvar:', error);
      alert('Erro ao salvar conta: ' + (error.message || 'Verifique o console'));
    }
  };

  if (loading) return <div className="p-12 text-3xl text-white">Carregando...</div>;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold text-green-400 mb-12">Nova Conta a Receber</h1>

      <div className="bg-gray-900 rounded-3xl p-12 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2">Cliente *</label>
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
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold"
              >
                +
              </button>
            </div>
            {filtro && clientesFiltrados.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-gray-800 rounded-lg">
                {clientesFiltrados.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClienteSelecionado(c);
                      setFiltro(`${c.nome} (${c.codigo})`);
                    }}
                    className="p-3 hover:bg-gray-700 cursor-pointer"
                  >
                    {c.nome} ({c.codigo})
                  </div>
                ))}
              </div>
            )}
            {clienteSelecionado && filtro === '' && (
              <p className="mt-2 text-green-400">Selecionado: {clienteSelecionado.nome} ({clienteSelecionado.codigo})</p>
            )}
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
            <p className="text-gray-400 text-sm mt-2">Obrigatório conter pelo menos uma letra</p>
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

        <div className="mb-8">
          <label className="block text-xl mb-2">Categoria *</label>
          <select
            value={categoriaSelecionada}
            onChange={(e) => setCategoriaSelecionada(e.target.value)}
            className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
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

      {modalNovo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalNovo(false)}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">Novo Cliente</h2>
            
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