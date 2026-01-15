'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 bg-gray-900 h-screen p-6 fixed left-0 top-0 flex flex-col">
      <h1 className="text-3xl font-bold text-white mb-12">Simple Finance</h1>

      <nav className="flex flex-col gap-4">
        <Link href="/dashboard" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/dashboard') ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
          Dashboard
        </Link>
        <Link href="/contas-pagar" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/contas-pagar') ? 'bg-red-900' : 'hover:bg-gray-800'}`}>
          <span className="text-red-400">Contas a Pagar</span>
        </Link>
        <Link href="/contas-receber" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/contas-receber') ? 'bg-green-900' : 'hover:bg-gray-800'}`}>
          <span className="text-green-400">Contas a Receber</span>
        </Link>
        <Link href="/categorias" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/categorias') ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
          Categorias
        </Link>
        {/* Removido o botão de Movimento de Caixa */}
        <Link href="/relatorios" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/relatorios') ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
          Relatórios
        </Link>
        <Link href="/perfil" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/perfil') ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
          Meu Perfil
        </Link>
      </nav>
    </div>
  );
}