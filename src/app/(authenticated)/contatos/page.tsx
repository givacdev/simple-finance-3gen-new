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
      <h1 className="text-5xl font-bold mb-8">Contatos</h1>
      <p className="text-xl text-gray-400 mb-12">Gerencie clientes e fornecedores</p>
      <div className="bg-gray-900 rounded-2xl p-8">
        <p className="text-center text-gray-400 text-2xl">Em breve: cadastro completo com código único 4 dígitos</p>
      </div>
    </div>
  );
}