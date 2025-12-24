'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NovaContaReceber() {
  const [user, setUser] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [fatura, setFatura] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [tipoParcelamento, setTipoParcelamento] = useState<'fixo' | 'manual'>('fixo');
  const [intervaloDias, setIntervaloDias] = useState('30');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCodigo, setNovoCodigo] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else {
        setUser(data.session.user);
        loadClientes(data.session.user.id);
      }
    };
    checkSession();
  }, [router]);

  const loadClientes = async (userId: string) => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', userId)
      .order('nome');
    setClientes(data || []);
  };

  const handleFaturaChange = (value: string) => {
    const filtered = value.replace(/[^A-Z0-9/-]/g, '').toUpperCase();
    setFatura(filtered);
  };

  const handleValorChange = (value: string) => {
    if (value === '' || Number(value) >= 0) {
      setValorTotal(value);
    }
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
    if (!clienteId || !valorTotal || Number(valorTotal) <= 0 || !parcelas) return;

    const valores = calcularParcelas();
    const numParcelas = Number(parcelas);
    let dataVenc = new Date(primeiroVencimento);

    for (let i = 0; i < numParcelas; i++) {
      await supabase.from('contas_receber').insert({
        user_id: user.id,
        cliente_id: clienteId,
        fatura,
        valor_total: Number(valorTotal),
        parcelas: numParcelas,
        parcela_atual: i + 1,
        valor_parcela: Number(valores[i]),
        data_vencimento: dataVenc.toISOString().split('T')[0],
        observacoes,
      });

      if (tipoParcelamento === 'fixo') {
        dataVenc.setDate(dataVenc.getDate() + Number(intervaloDias));
      }
    }

    router.push('/contas-receber');
  };

  const handleNovoCliente = async () => {
    if (novoNome && novoCodigo.length === 4) {
      const { data } = await supabase.from('clientes').insert({
        user_id: user.id,
        nome: novoNome,
        codigo: novoCodigo,
      }).select();
      if (data) {
        setClientes([...clientes, data[0]]);
        setClienteId(data[0].id);
        setModalNovoCliente(false);
        setNovoNome('');
        setNovoCodigo('');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8">Nova Conta a Receber</h1>

      <div className="bg-gray-900 p-10 rounded-2xl max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-xl mb-2">Cliente *</label>
            <div className="flex gap-4">
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="flex-1 p-4 bg-gray-800 rounded-lg">
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.codigo})</option>
                ))}
              </select>
              <button onClick={() => setModalNovoCliente(true)} className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-xl font-bold text-2xl">
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xl mb-2">Número da Fatura</label>
            <input 
              value={fatura} 
              onChange={(e) => handleFaturaChange(e.target.value)} 
              placeholder="Ex: REC-001 ou 6535/-" 
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
                <>
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

                  <div>
                    <label className="block text-xl mb-2">Primeiro Vencimento *</label>
                    <input 
                      type="date" 
                      value={primeiroVencimento} 
                      onChange={(e) => setPrimeiroVencimento(e.target.value)} 
                      className="w-full p-4 bg-gray-800 rounded-lg" 
                    />
                  </div>

                  {primeiroVencimento && (
                    <div className="md:col-span-2 mt-8">
                      <p className="text-xl font-bold mb-4">Pré-visualização das parcelas:</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        {(() => {
                          const preview = [];
                          let data = new Date(primeiroVencimento);
                          const valores = calcularParcelas();
                          for (let i = 0; i < Number(parcelas); i++) {
                            preview.push(
                              <div key={i} className="bg-gray-800 p-4 rounded-lg">
                                <p className="font-bold">Parcela {i + 1}/{parcelas}</p>
                                <p>Vencimento: {data.toLocaleDateString('pt-BR')}</p>
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
            </>
          )}

          <div className="md:col-span-2">
            <label className="block text-xl mb-2">Observações</label>
            <textarea 
              value={observacoes} 
              onChange={(e) => set