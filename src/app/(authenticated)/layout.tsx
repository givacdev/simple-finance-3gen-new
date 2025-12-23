import '../globals.css';
import { Inter } from 'next/font/google';
import Sidebar from '../components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className + " bg-gray-950 text-white"}>
        <Sidebar />
        <div className="ml-64 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}