// src/components/Sidebar.tsx (ou onde estiver tua sidebar)

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="bg-gray-900 w-64 min-h-screen p-8 flex flex-col justify-between">
      <div>
        <h1 className="text-3xl font-bold mb-12">Simple Finance 3Gen</h1>

        <Link href="/dashboard">
          <button className="w-full py-4 mb-4 bg-blue-600 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>🏠</span> Dashboard
          </button>
        </Link>

        {/* Removida a aba Lançamentos */}

        <Link href="/contas-pagar">
          <button className="w-full py-4 mb-4 bg-red-600 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>🔴</span> Contas a Pagar
          </button>
        </Link>

        <Link href="/contas-receber">
          <button className="w-full py-4 mb-4 bg-green-600 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>🟢</span> Contas a Receber
          </button>
        </Link>

        <Link href="/caixa">
          <button className="w-full py-4 mb-4 bg-purple-600 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>📊</span> Movimento de Caixa
          </button>
        </Link>

        <Link href="/contatos">
          <button className="w-full py-4 mb-4 bg-indigo-600 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>👥</span> Contatos
          </button>
        </Link>

        <Link href="/categorias">
          <button className="w-full py-4 mb-4 bg-yellow-600 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>🏷️</span> Categorias
          </button>
        </Link>

        <Link href="/relatorios">
          <button className="w-full py-4 mb-4 bg-teal-600 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>📈</span> Relatórios
          </button>
        </Link>

        <Link href="/perfil">
          <button className="w-full py-4 mb-4 bg-gray-700 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>👤</span> Meu Perfil
          </button>
        </Link>

        <Link href="/planos">
          <button className="w-full py-4 mb-4 bg-orange-600 rounded-xl font-bold text-xl flex items-center gap-4">
            <span>⭐</span> Planos
          </button>
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-4 bg-red-700 rounded-xl font-bold text-xl"
      >
        Sair
      </button>
    </div>
  );
}