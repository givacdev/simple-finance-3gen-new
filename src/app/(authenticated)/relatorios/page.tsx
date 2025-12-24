'use client';

import Link from 'next/link';

export default function Relatorios() {
  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold mb-8">Relatórios Financeiros</h1>
      <p className="text-xl text-gray-400 mb-12">Exporte e analise seus dados</p>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="bg-red-900/30 p-12 rounded-2xl text-center">
          <h3 className="text-3xl font-bold mb-4">Contas a Pagar</h3>
          <p className="text-xl text-gray-400 mb-8">Relatório completo com filtros</p>
          <div className="flex justify-center gap-4">
            <Link href="/relatorios/contas-pagar">
              <button className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold">Visualizar</button>
            </Link>
          </div>
        </div>

        <div className="bg-green-900/30 p-12 rounded-2xl text-center">
          <h3 className="text-3xl font-bold mb-4">Contas a Receber</h3>
          <p className="text-xl text-gray-400 mb-8">Relatório completo com filtros</p>
          <div className="flex justify-center gap-4">
            <Link href="/relatorios/contas-receber">
              <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold">Visualizar</button>
            </Link>
          </div>
        </div>

        <div className="bg-blue-900/30 p-12 rounded-2xl text-center">
          <h3 className="text-3xl font-bold mb-4">Fluxo de Caixa</h3>
          <p className="text-xl text-gray-400 mb-8">Histórico completo de entradas/saídas</p>
          <div className="flex justify-center gap-4">
            <Link href="/relatorios/caixa">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold">Visualizar</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}