'use client';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white pl-0 lg:pl-64 p-6 lg:p-12">
      <h1 className="text-5xl font-bold mb-12">Dashboard TESTE LAYOUT</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Saldo grande */}
        <div className="lg:col-span-2 bg-blue-900 p-10 rounded-3xl text-center min-h-[400px] flex flex-col justify-center">
          <h2 className="text-3xl mb-4">Saldo em Caixa (TESTE)</h2>
          <p className="text-6xl font-bold">R$ 999.999</p>
        </div>

        {/* 8 cards teste */}
        <div className="bg-green-900 p-6 rounded-3xl text-center">Card 1</div>
        <div className="bg-red-900 p-6 rounded-3xl text-center">Card 2</div>
        <div className="bg-teal-900 p-6 rounded-3xl text-center">Card 3</div>
        <div className="bg-purple-900 p-6 rounded-3xl text-center">Card 4</div>

        <div className="bg-green-900 p-6 rounded-3xl text-center">Card 5</div>
        <div className="bg-orange-900 p-6 rounded-3xl text-center">Card 6</div>
        <div className="bg-purple-900 p-6 rounded-3xl text-center">Card 7</div>
        <div className="bg-teal-900 p-6 rounded-3xl text-center">Card 8</div>
      </div>
    </div>
  );
}