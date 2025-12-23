'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/contas-pagar', label: 'Contas a Pagar', icon: '🔴' },
  { href: '/contas-receber', label: 'Contas a Receber', icon: '🟢' },
  { href: '/caixa', label: 'Movimento de Caixa', icon: '💰' },
  { href: '/contatos', label: 'Contatos', icon: '👥' },
  { href: '/categorias', label: 'Categorias', icon: '🏷️' },
  { href: '/relatorios', label: 'Relatórios', icon: '📊' },
  { href: '/perfil', label: 'Meu Perfil', icon: '👤' },
  { href: '/planos', label: 'Planos', icon: '⭐' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 h-screen fixed left-0 top-0 p-6 overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-12">Simple Finance 3Gen</h1>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-6 py-4 rounded-xl text-xl font-medium transition ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
