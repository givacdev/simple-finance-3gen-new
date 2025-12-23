'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Perfil() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
      else setUser(data.session.user);
    };
    checkSession();
  }, [router]);

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8">Meu Perfil</h1>
      <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl">
        <p className="text-2xl mb-4">E-mail: {user.email}</p>
        <p className="text-xl text-gray-400 mb-8">Plano: Grátis (Premium disponível)</p>
        <button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-xl">
          Alterar Senha
        </button>
      </div>
    </div>
  );
}