'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 bg-gray-900 h-screen p-6 fixed left-0 top-0 flex flex-col overflow-y-auto lg:block hidden"> {/* Hidden em mobile, sticky em desktop */}
      <h1 className="text-3xl font-bold text-white mb-12">Simple Finance</h1>

      <nav className="flex flex-col gap-4">
        <Link href="/dashboard" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/dashboard') ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
          Dashboard
        </Link>
        <Link href="/contas-pagar" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/contas-pagar') ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
          Contas a Pagar
        </Link>
        <Link href="/contas-receber" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/contas-receber') ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
          Contas a Receber
        </Link>
        <Link href="/categorias" className={`flex items-center gap-3 p-4 rounded-lg ${isActive('/categorias') ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
          Categorias
        </Link>
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