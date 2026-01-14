'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Categoria {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
}

export default function Categorias() {
  const [user, setUser] = useState<any>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa');
  const [editando, setEditando] = useState<Categoria | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadCategorias(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadCategorias = async (userId: string) => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('user_id', userId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao carregar categorias:', error);
      alert('Erro ao carregar categorias');
      return;
    }

    setCategorias(data || []);
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      alert('Nome da categoria é obrigatório');
      return;
    }

    try {
      if (editando) {
        const { error } = await supabase
          .from('categorias')
          .update({ nome: nome.trim(), tipo })
          .eq('id', editando.id);

        if (error) throw error;
        alert('Categoria atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('categorias')
          .insert({ user_id: user.id, nome: nome.trim(), tipo });

        if (error) throw error;
        alert('Categoria criada com sucesso!');
      }

      setNome('');
      setTipo('despesa');
      setEditando(null);
      loadCategorias(user.id);
    } catch (error: any) {
      alert('Erro ao salvar categoria: ' + error.message);
    }
  };

  const handleEditar = (cat: Categoria) => {
    setNome(cat.nome);
    setTipo(cat.tipo);
    setEditando(cat);
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;
      alert('Categoria excluída com sucesso!');
      loadCategorias(user.id);
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold text-white mb-8">Categorias</h1>
      <p className="text-xl text-gray-400 mb-12">Organize entradas e saídas do seu caixa</p>

      {/* Formulário */}
      <div className="bg-gray-900 rounded-3xl p-8 mb-12 max-w-2xl">
        <h2 className="text-3xl font-bold text-green-400 mb-6">
          {editando ? 'Editar Categoria' : 'Nova Categoria'}
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2">Nome da Categoria *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
              placeholder="Ex: Fornecedores, Vendas Diretas"
            />
          </div>

          <div>
            <label className="block text-xl mb-2">Tipo *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'receita' | 'despesa')}
              className="w-full p-4 bg-gray-800 rounded-lg text-white text-xl"
            >
              <option value="despesa">Despesa (Saída)</option>
              <option value="receita">Receita (Entrada)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-6">
          {editando && (
            <button
              onClick={() => {
                setNome('');
                setTipo('despesa');
                setEditando(null);
              }}
              className="px-8 py-4 bg-gray-600 hover:bg-gray-500 rounded-xl font-bold text-xl"
            >
              Cancelar Edição
            </button>
          )}
          <button
            onClick={handleSalvar}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xl"
          >
            {editando ? 'Atualizar Categoria' : 'Criar Categoria'}
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-gray-900 rounded-3xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {categorias.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">Nenhuma categoria cadastrada ainda.</p>
          ) : (
            categorias.map((cat) => (
              <div key={cat.id} className="p-8 flex justify-between items-center hover:bg-gray-800 transition">
                <div>
                  <p className="text-3xl font-bold">{cat.nome}</p>
                  <p className="text-gray-400 mt-2">
                    Tipo: {cat.tipo === 'despesa' ? 'Despesa (Saída)' : 'Receita (Entrada)'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleEditar(cat)}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-xl"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluir(cat.id)}
                    className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-bold text-xl"
                  >
                    Excluir
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