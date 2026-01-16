'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function MovimentoCaixa() {
  const [user, setUser] = useState<any>(null);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [categoriaId, setCategoriaId] = useState('');
  const [dataLancamento, setDataLancamento] = useState(new Date().toISOString().split('T')[0]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadCategorias();
      loadMovimentos(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadCategorias = async () => {
    const { data } = await supabase
      .from('categorias_caixa')
      .select('*')
      .or('user_id.is.null,padrao.eq.true')  // categorias padrão + do usuário (futuro)
      .order('nome');
    setCategorias(data || []);
  };

  const categoriasFiltradas = categorias.filter((c: any) => c.tipo === tipo);

  const loadMovimentos = async (userId: string) => {
    let query = supabase
      .from('movimentos_caixa')
      .select('*, categorias_caixa(nome)')
      .eq('user_id', userId)
      .order('data', { ascending: false });

    if (dataInicio) query = query.gte('data', dataInicio);
    if (dataFim) query = query.lte('data', dataFim);

    const { data } = await query;
    setMovimentos(data || []);

    let ent = 0;
    let sai = 0;
    (data || []).forEach((m: any) => {
      if (m.tipo === 'entrada') ent += Number(m.valor);
      else sai += Number(m.valor);
    });
    setEntradas(ent);
    setSaidas(sai);
    setSaldo(ent - sai);
  };

  const handleSubmit = async () => {
    if (!descricao || !valor || Number(valor) <= 0 || !categoriaId) {
      alert('Preencha descrição, valor e categoria');
      return;
    }

    const { error } = await supabase.from('movimentos_caixa').insert({
      user_id: user.id,
      descricao,
      valor: Number(valor),
      tipo,
      categoria_id: categoriaId,
      data: dataLancamento,
    });

    if (error) {
      alert('Erro ao salvar: ' + error.message);
      return;
    }

    setDescricao('');
    setValor('');
    setCategoriaId('');
    loadMovimentos(user.id);
  };

  const aplicarFiltro = () => {
    loadMovimentos(user.id);
  };

  useEffect(() => {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 30);
    setDataInicio(inicio.toISOString().split('T')[0]);
    setDataFim(hoje.toISOString().split('T')[0]);
  }, []);

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <span className="text-blue-500">📊</span> Movimento de Caixa
      </h1>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-green-900 p-8 rounded-2xl text-center">
          <p className="text-2xl text-green-300">Entradas (+)</p>
          <p className="text-5xl font-bold mt-4">R$ {entradas.toFixed(2)}</p>
        </div>
        <div className="bg-red-900 p-8 rounded-2xl text-center">
          <p className="text-2xl text-red-300">Saídas (-)</p>
          <p className="text-5xl font-bold mt-4">R$ {saidas.toFixed(2)}</p>
        </div>
        <div className={`p-8 rounded-2xl text-center ${saldo >= 0 ? 'bg-blue-900' : 'bg-orange-900'}`}>
          <p className="text-2xl text-gray-300">Saldo</p>
          <p className={`text-5xl font-bold mt-4 ${saldo >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>
            R$ {saldo.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 p-8 rounded-2xl mb-12">
        <h2 className="text-3xl font-bold mb-6">Novo Lançamento</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-xl mb-2">Descrição *</label>
            <input 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              placeholder="Ex: Salário, Conta de luz" 
              className="w-full p-4 bg-gray-800 rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-xl mb-2">Valor (R$)*</label>
            <input 
              type="number" 
              min="0" 
              step="0.01" 
              value={valor} 
              onChange={(e) => setValor(e.target.value)} 
              className="w-full p-4 bg-gray-800 rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-xl mb-2">Tipo</label>
            <select 
              value={tipo} 
              onChange={(e) => {
                setTipo(e.target.value as 'entrada' | 'saida');
                setCategoriaId('');
              }} 
              className="w-full p-4 bg-gray-800 rounded-lg"
            >
              <option value="entrada">Entrada (+)</option>
              <option value="saida">Saída (-)</option>
            </select>
          </div>
          <div>
            <label className="block text-xl mb-2">Categoria *</label>
            <select 
              value={categoriaId} 
              onChange={(e) => setCategoriaId(e.target.value)} 
              className="w-full p-4 bg-gray-800 rounded-lg"
            >
              <option value="">Selecione uma categoria</option>
              {categoriasFiltradas.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xl mb-2">Data</label>
            <input 
              type="date" 
              value={dataLancamento} 
              onChange={(e) => setDataLancamento(e.target.value)} 
              className="w-full p-4 bg-gray-800 rounded-lg" 
            />
          </div>
        </div>
        <div className="mt-8 text-right">
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-xl">
            Lançar
          </button>
        </div>
      </div>

      {/* Filtro e Extrato (mesmo do código anterior) */}
      <div className="bg-gray-900 p-8 rounded-2xl mb-12">
        <h2 className="text-3xl font-bold mb-6">Filtro por Período</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <label className="block text-xl mb-2">Data Inicial</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg" />
          </div>
          <div>
            <label className="block text-xl mb-2">Data Final</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full p-4 bg-gray-800 rounded-lg" />
          </div>
          <div className="flex items-end">
            <button onClick={aplicarFiltro} className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-xl w-full">
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-3xl font-bold">Extrato</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {movimentos.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">Nenhum movimento no período.</p>
          ) : (
            movimentos.map((m) => (
              <div key={m.id} className="p-8 hover:bg-gray-800 transition">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-3xl font-bold">{m.descricao}</p>
                    <p className="text-gray-400 mt-2">
                      {m.categorias_caixa?.nome || 'Sem categoria'} • {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className={`text-4xl font-bold ${m.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                    {m.tipo === 'entrada' ? '+' : '-'} R$ {Number(m.valor).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}