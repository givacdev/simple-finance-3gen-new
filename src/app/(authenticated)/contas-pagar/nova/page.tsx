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
  const [modalNovoFornecedor, setModalNovoFornecedor] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCodigo, setNovoCodigo] = useState('');
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

  const handleFaturaChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z0-9/-]/g, '').toUpperCase();
    setFatura(filtered);
  };

  const handleValorChange = (value: string) => {
    if (value === '' || Number(value) >= 0) {
      setValorTotal(value);
    }
  };

  const handleCodigoChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
    setNovoCodigo(filtered);
  };

  const calcularParcelas = () => {
    const total = Number(valorTotal);
    const numParcelas = Number(parcelas);
    if (numParcelas <= 0 || total <= 0) return [];
    const valorBase = Math.floor((total / numParcelas) * 100) / 100;
    const resto = Number((total - valorBase * numParcelas).toFixed(2));
    const valores = [];
    for (let i = 0; i < numParcelas; i++) {
      let valor = valorBase;
      if (i < resto * 100) valor += 0.01;
      valores.push(valor.toFixed(2));
    }
    return valores;
  };

  const handleSubmit = async () => {
    if (!fornecedorId || !valorTotal || Number(valorTotal) <= 0) {
      alert('Preencha fornecedor e valor total');
      return;
    }

    if (!primeiroVencimento) {
      alert('Informe a data de vencimento');
      return;
    }

    try {
      const valores = calcularParcelas();
      const numParcelas = Number(parcelas);
      let dataVenc = new Date(primeiroVencimento + 'T12:00:00');

      for (let i = 0; i < numParcelas; i++) {
        const dataStr = dataVenc.toISOString().split('T')[0];
        const { error } = await supabase.from('contas_pagar').insert({
          user_id: user.id,
          fornecedor_id: fornecedorId,
          fatura,
          valor_total: Number(valorTotal),
          parcelas: numParcelas,
          parcela_atual: i + 1,
          valor_parcela: Number(valores[i]),
          data_vencimento: dataStr,
          observacoes,
        });

        if (error) throw error;

        if (tipoParcelamento === 'fixo') {
          dataVenc.setDate(dataVenc.getDate() + Number(intervaloDias));
        }
      }

      router.push('/contas-pagar');
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleNovoFornecedor = async () => {
    if (novoNome && novoCodigo.length === 4) {
      const { data, error } = await supabase.from('fornecedores').insert({
        user_id: user.id,
        nome: novoNome,
        codigo: novoCodigo,
      }).select();

      if (error) {
        alert('Erro ao salvar fornecedor: ' + error.message);
        return;
      }

      if (data) {
        setFornecedores([...fornecedores, data[0]]);
        setFornecedorId(data[0].id);
        setModalNovoFornecedor(false);
        setNovoNome('');
        setNovoCodigo('');
      }
    } else {
      alert('Preencha nome e código de 4 caracteres');
    }
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8">Nova Conta a Pagar</h1>

      <div className="bg-gray-900 p-10 rounded-2xl max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-xl mb-2">Fornecedor *</label>
            <div className="flex gap-4">
              <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className="flex-1 p-4 bg-gray-800 rounded-lg">
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome} ({f.codigo})</option>
                ))}
              </select>
              <button onClick={() => setModalNovoFornecedor(true)} className="bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl font-bold text-2xl">
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xl mb-2">Número da Fatura</label>
            <input 
              value={fatura} 
              onChange={(e) => handleFaturaChange(e.target.value)} 
              placeholder="Ex: INV001 ou 310/AS" 
              className="w-full p-4 bg-gray-800 rounded-lg" 
            />
          </div>

          <div>
            <label className="block text-xl mb-2">Valor Total (R$)*</label>
            <input 
              type="number" 
              min="0" 
              step="0.01"
              value={valorTotal} 
              onChange={(e) => handleValorChange(e.target.value)} 
              className="w-full p-4 bg-gray-800 rounded-lg" 
            />
          </div>

          <div>
            <label className="block text-xl mb-2">Número de Parcelas *</label>
            <input 
              type="number" 
              min="1"
              value={parcelas} 
              onChange={(e) => setParcelas(e.target.value || '1')} 
              className="w-full p-4 bg-gray-800 rounded-lg" 
            />
          </div>

          {(Number(parcelas) === 1 || (Number(parcelas) > 1 && tipoParcelamento === 'fixo')) && (
            <div>
              <label className="block text-xl mb-2">Data de Vencimento *</label>
              <input 
                type="date" 
                value={primeiroVencimento} 
                onChange={(e) => setPrimeiroVencimento(e.target.value)} 
                className="w-full p-4 bg-gray-800 rounded-lg" 
              />
            </div>
          )}

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
                <div>
                  <label className="block text-xl mb-2">Intervalo de dias</label>
                  <input 
                    type="number" 
                    min="1"
                    value={intervaloDias} 
                    onChange={(e) => setIntervaloDias(e.target.value)} 
                    className="w-full p-4 bg-gray-800 rounded-lg" 
                  />
                </div>
              )}

              {tipoParcelamento === 'fixo' && primeiroVencimento && (
                <div className="md:col-span-2 mt-8">
                  <p className="text-xl font-bold mb-4">Pré-visualização das parcelas:</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    {(() => {
                      const preview = [];
                      let data = new Date(primeiroVencimento + 'T12:00:00');
                      const valores = calcularParcelas();
                      for (let i = 0; i < Number(parcelas); i++) {
                        const dataStr = data.toISOString().split('T')[0];
                        const dataFormatada = new Date(dataStr).toLocaleDateString('pt-BR');
                        preview.push(
                          <div key={i} className="bg-gray-800 p-4 rounded-lg">
                            <p className="font-bold">Parcela {i + 1}/{parcelas}</p>
                            <p>Vencimento: {dataFormatada}</p>
                            <p>Valor: R$ {valores[i] || '0.00'}</p>
                          </div>
                        );
                        data.setDate(data.getDate() + Number(intervaloDias));
                      }
                      return preview;
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="md:col-span-2">
            <label className="block text-xl mb-2">Observações</label>
            <textarea 
              value={observacoes} 
              onChange={(e) => setObservacoes(e.target.value)} 
              className="w-full p-4 bg-gray-800 rounded-lg" 
              rows={4}
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-6 mt-12">
          <button onClick={() => router.back()} className="px-8 py-4 rounded-xl font-bold text-xl">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-xl">
            Salvar
          </button>
        </div>
      </div>

      {modalNovoFornecedor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl max-w-md w-full">
            <h2 className="text-3xl font-bold mb-6">Novo Fornecedor</h2>
            <input placeholder="Nome completo *" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} className="w-full p-4 mb-4 bg-gray-800 rounded-lg" />
            <input placeholder="Código (4 caracteres - letras e números) *" value={novoCodigo} onChange={(e) => handleCodigoChange(e.target.value)} className="w-full p-4 mb-8 bg-gray-800 rounded-lg" />
            <div className="flex justify-end gap-4">
              <button onClick={() => setModalNovoFornecedor(false)} className="px-6 py-3 rounded-xl font-bold">Cancelar</button>
              <button onClick={handleNovoFornecedor} className="bg-red-600 px-6 py-3 rounded-xl font-bold">
                Salvar Fornecedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}