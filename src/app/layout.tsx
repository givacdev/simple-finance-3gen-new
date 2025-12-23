import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Simple Finance 3Gen',
  description: 'Finanças pessoais simples, bonitas e poderosas',
};

export default function RootLayout({
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
