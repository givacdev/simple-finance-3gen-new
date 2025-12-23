'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Caixa() {
  const [user, setUser] = useState<any>(null);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else {
        setUser(data.session.user);
        loadMovimentos(data.session.user.id);
      }
    };
    checkSession();
  }, [router]);

  const loadMovimentos = async (userId: string) => {
    // Por enquanto vazio – vamos adicionar tabela de caixa depois
    setMovimentos([]);
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-bold flex items-center gap-4">
            <span className="text-blue-500">💰</span> Movimento de Caixa
          </h1>
          <p className="text-xl text-gray-400 mt-2">Histórico completo de entradas e saídas</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-8">
        <p className="text-center text-gray-400 text-2xl">Em breve: entradas, saídas e categorização completa</p>
      </div>
    </div>
  );
}