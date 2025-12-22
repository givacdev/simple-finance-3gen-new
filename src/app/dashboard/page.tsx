'use client';

import { useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push('/');
    };
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-7xl font-bold text-green-400 mb-8">
          TÁ VIVO PORRA!!!
        </h1>
        <p className="text-3xl mb-8">
          Simple Finance 3Gen rodando 100% com Supabase
        </p>
        <p className="text-5xl mb-8">
          R$ 11.800 a receber da RAFAMAQ
        </p>
        <p className="text-5xl">
          R$ 4.698 a pagar (Techposto + Técnica L.S.)
        </p>
      </div>
    </div>
  );
}