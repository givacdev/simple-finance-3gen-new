'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const [saldoCaixa, setSaldoCaixa] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchSaldo = async () => {
      const { data: movimentos } = await supabase
        .from('movimentos_caixa')
        .select('valor, tipo');
      let saldo = 0;
      movimentos?.forEach(m => {
        saldo += m.tipo === 'entrada' ? m.valor : -m.valor;
      });
      setSaldoCaixa(saldo);
    };
    fetchSaldo();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <h1 className="text-4xl lg:text-5xl font-bold mb-12">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        {/* Saldo em Caixa - grande e quadrado */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800 text-white aspect-square flex flex-col justify-between p-8">
          <CardHeader>
            <CardTitle className="text-3xl">Saldo em Caixa</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-6xl font-bold">R$ {saldoCaixa.toFixed(2)}</p>
          </CardContent>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button variant="success" onClick={() => alert('Entrada em breve')}>
              Entrada
            </Button>
            <Button variant="destructive" onClick={() => alert('Saída em breve')}>
              Saída
            </Button>
            <Button variant="secondary" onClick={() => router.push('/lancamentos')}>
              Movimentação
            </Button>
          </div>
        </Card>

        {/* Cards menores */}
        <Card className="bg-green-950/50 border-green-800">
          <CardHeader>
            <CardTitle>Total a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">R$ 1.150,66</p>
          </CardContent>
        </Card>

        <Card className="bg-red-950/50 border-red-800">
          <CardHeader>
            <CardTitle>Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">R$ 3.218,30</p>
          </CardContent>
        </Card>

        <Card className="bg-teal-950/50 border-teal-800">
          <CardHeader>
            <CardTitle>Juros Recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">R$ 22,50</p>
            <Badge variant="secondary" className="mt-2">3.9% últimos 30 dias</Badge>
          </CardContent>
        </Card>

        <Card className="bg-purple-950/50 border-purple-800">
          <CardHeader>
            <CardTitle>Juros Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">R$ 32,50</p>
            <Badge variant="secondary" className="mt-2">15.0% últimos 30 dias</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Próximos vencimentos e recebimentos (mantém como está ou simplifica) */}
      {/* ... coloca aqui o bloco dos próximos se quiser */}
    </div>
  );
}