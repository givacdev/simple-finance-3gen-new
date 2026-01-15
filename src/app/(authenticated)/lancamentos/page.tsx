'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Lancamentos() {
  const [user, setUser] = useState<any>(null);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = '/';
        return;
      }
      setUser(data.session.user);
      await loadMovimentos(data.session.user.id);
      setLoading(false);
    };
    checkSession();
  }, []);

  const loadMovimentos = async (userId: string) => {
    const { data, error } = await supabase
      .from('movimentos_caixa')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao carregar lançamentos:', error);
      alert('Erro ao carregar os lançamentos. Verifique o console.');
      return;
    }

    setMovimentos(data || []);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '—';
    const dt = DateTime.fromISO(isoString, { zone: 'America/Sao_Paulo' });
    return dt.isValid ? dt.toFormat('dd/MM/yyyy HH:mm') : 'Data inválida';
  };

  if (loading) {
    return (
      <div className="p-12 min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-3xl">Carregando lançamentos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 min-h-screen bg-black text-white">
      <h1 className="text-4xl lg:text-5xl font-bold mb-10">Lançamentos do Caixa</h1>

      <div className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800">
        {movimentos.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xl">
            Nenhum lançamento registrado ainda.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {movimentos.map((mov) => (
              <div
                key={mov.id}
                className="p-6 lg:p-8 hover:bg-gray-800 transition flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
              >
                <div className="flex-1">
                  <p className="text-xl lg:text-2xl font-bold">{mov.descricao}</p>
                  <p className="text-gray-400 mt-1">
                    {formatDate(mov.data)} • {mov.tipo.toUpperCase()}
                  </p>
                  {mov.categoria && (
                    <p className="text-sm text-gray-500 mt-1">Categoria: {mov.categoria}</p>
                  )}
                </div>

                <p
                  className={`text-2xl lg:text-3xl font-bold whitespace-nowrap ${
                    mov.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {mov.tipo === 'entrada' ? '+' : '-'} R$ {Number(mov.valor).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}