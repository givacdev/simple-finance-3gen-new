'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/lancamentos', label: 'Lançamentos', icon: '💰' },
    { href: '/contas-pagar', label: 'Contas a Pagar', icon: '🔴' },
    { href: '/contas-receber', label: 'Contas a Receber', icon: '🟢' },
    { href: '/caixa', label: 'Movimento de Caixa', icon: '📊' },
    { href: '/contatos', label: 'Contatos', icon: '👥' },
    { href: '/categorias', label: 'Categorias', icon: '🏷️' },
    { href: '/relatorios', label: 'Relatórios', icon: '📈' },
    { href: '/perfil', label: 'Meu Perfil', icon: '👤' },
    { href: '/planos', label: 'Planos', icon: '⭐' },
  ];

  return (
    <nav className="bg-gray-900 w-64 min-h-screen p-8">
      <h1 className="text-2xl font-bold text-white mb-12">Simple Finance 3Gen</h1>

      <div className="space-y-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold text-xl ${pathname === item.href ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {item.icon} {item.label}
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}