'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Contatos() {
  const [user, setUser] = useState<any>(null);
  const [tipo, setTipo] = useState<'fornecedor' | 'cliente'>('fornecedor');
  const [contatos, setContatos] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else {
        setUser(data.session.user);
        loadContatos();
      }
    };
    checkSession();
  }, [router, tipo]);

  const loadContatos = async () => {
    const table = tipo === 'fornecedor' ? 'fornecedores' : 'clientes';
    const { data } = await supabase.from(table).select('*').eq('user_id', user.id);
    setContatos(data || []);
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-bold">Gestão de Contatos</h1>
          <p className="text-xl text-gray-400 mt-2">Gerencie seus clientes e fornecedores • Contatos: {contatos.length} / ilimitado</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-xl">
          + Novo {tipo === 'fornecedor' ? 'Fornecedor' : 'Cliente'}
        </button>
      </div>

      <div className="flex gap-6 mb-8">
        <button onClick={() => setTipo('fornecedor')} className={`px-8 py-4 rounded-xl font-bold text-xl ${tipo === 'fornecedor' ? 'bg-red-600' : 'bg-gray-700'}`}>
          Fornecedores
        </button>
        <button onClick={() => setTipo('cliente')} className={`px-8 py-4 rounded-xl font-bold text-xl ${tipo === 'cliente' ? 'bg-green-600' : 'bg-gray-700'}`}>
          Clientes
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <input placeholder="Buscar por nome, código ou documento..." className="w-full p-4 bg-gray-800 rounded-lg" />
        </div>

        <div className="divide-y divide-gray-800">
          {contatos.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">Nenhum {tipo} cadastrado.</p>
          ) : (
            contatos.map((contato) => (
              <div key={contato.id} className="p-8 hover:bg-gray-800 transition flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{contato.nome}</p>
                  <p className="text-xl text-gray-400">Código: {contato.codigo} • {contato.recorrencia ? 'Recorrência ativa' : 'Sem recorrência'}</p>
                </div>
                <div className="flex gap-4">
                  <button className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-xl font-bold">Editar</button>
                  <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold">Excluir</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}