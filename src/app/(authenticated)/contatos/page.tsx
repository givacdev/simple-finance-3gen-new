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
  const [tipo, setTipo] = useState<'cliente' | 'fornecedor'>('fornecedor');
  const [contatos, setContatos] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else {
        setUser(data.session.user);
        loadContatos(data.session.user.id);
      }
    };
    checkSession();
  }, [router]);

  const loadContatos = async (userId: string) => {
    const table = tipo === 'cliente' ? 'clientes' : 'fornecedores';
    const { data } = await supabase.from(table).select('*').eq('user_id', userId);
    setContatos(data || []);
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8">Contatos</h1>
      <p className="text-xl text-gray-400 mb-12">Gerencie seus clientes e fornecedores</p>

      <div className="flex gap-6 mb-8">
        <button onClick={() => setTipo('fornecedor')} className={`px-8 py-4 rounded-xl font-bold ${tipo === 'fornecedor' ? 'bg-red-600' : 'bg-gray-700'}`}>
          Fornecedores
        </button>
        <button onClick={() => setTipo('cliente')} className={`px-8 py-4 rounded-xl font-bold ${tipo === 'cliente' ? 'bg-green-600' : 'bg-gray-700'}`}>
          Clientes
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-8">
        <p className="text-center text-gray-400 text-2xl">Em breve: cadastro completo com código 4 dígitos único, recorrência automática e validação</p>
      </div>
    </div>
  );
}