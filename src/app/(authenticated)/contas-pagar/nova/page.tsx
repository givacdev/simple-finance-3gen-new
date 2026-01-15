'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Fornecedor {
  id: string;
  nome: string;
  codigo: string;
}

interface Categoria {
  id: string;
  nome: string;
}

export default function NovaContaPagar() {
  const [user, setUser] = useState<any>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtro, setFiltro] = useState('');
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [modalNovo, setModalNovo] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [codigoNovo, setCodigoNovo] = useState('');
  const [fatura, setFatura] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [intervaloDias, setIntervaloDias] = useState('30');
  const [dataVencimento, setDataVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [previewParcelas, setPreviewParcelas] = useState<{ valor: number; vencimento: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      console.log('User ID no nova conta pagar:', data.session.user.id); // Debug user_id
      loadFornecedores(data.session.user.id);
      loadCategorias(data.session.user.id);
    };
    checkSession();
  }, [router]);

  const loadFornecedores = async (userId: string) => {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome, codigo')
      .eq('user_id', userId)
      .order('nome');
    setFornecedores(data || []);
  };

  const loadCategorias = async (userId: string) => {
    const { data } = await supabase
      .from('categorias')
      .select('id, nome')
      .eq('user_id', userId)
      .eq('tipo', 'despesa') // Só despesas!
      .order('nome');
    setCategorias(data || []);
  };

  const fornecedoresFiltrados = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    f.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleNovoFornecedor = async () => {
    if (!nomeNovo.trim() || !codigoNovo.trim()) {
      alert('Nome e código são obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({
          user_id: user.id,
          nome: nomeNovo.toUpperCase().trim(),
          codigo: codigoNovo.toUpperCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;

      alert('Fornecedor cadastrado!');
      await loadFornecedores(user.id);
      setFornecedorSelecionado(data);
      setFiltro(`${data.nome} (${data.codigo})`);
      setModalNovo(false);
      setNomeNovo('');
      setCodigoNovo('');
    } catch (error: any) {
      alert('Erro ao cadastrar fornecedor: ' + error.message);
    }
  };

  useEffect(() => {
    if (valorTotal && parcelas && dataVencimento && intervaloDias && fornecedorSelecionado) {
      const total = Number(valorTotal);
      const numParcelas = Number(parcelas);
      const interval = Number(intervaloDias);
      const valorBase = Math.floor((total / numParcelas) * 100) / 100;
      const centavosExtras = Math.round((total - (valorBase * numParcelas)) * 100);
      const preview = [];

      for (let i = 1; i <= numParcelas; i++) {
        let valor = valorBase;
        if (i <= centavosExtras) valor += 0.01;

        const [ano, mes, dia] = dataVencimento.split('-');
        const baseDate = new Date(Number(ano), Number(mes) - 1, Number(dia));
        baseDate.setDate(baseDate.getDate() + (interval * (i - 1)));
        const dataStr = baseDate.toISOString().split('T')[0];

        preview.push({ valor: Number(valor.toFixed(2)), vencimento: dataStr });
      }

      setPreviewParcelas(preview);
    } else {
      setPreviewParcelas([]);
    }
  }, [valorTotal, parcelas, intervaloDias, dataVencimento, fornecedorSelecionado]);

  const handleSalvar = async () => {
    if (!fornecedorSelecionado) return alert('Selecione um fornecedor');
    if (!categoriaSelecionada) return alert('Selecione uma categoria');
    if (!fatura.trim()) return alert('Número da fatura obrigatório');
    if (!/[a-zA-Z]/.test(fatura)) return alert('Fatura deve ter pelo menos uma letra');
    if (!valorTotal || Number(valorTotal) <= 0) return alert('Valor válido obrigatório');
    if (!dataVencimento) return alert('Data de vencimento obrigatória');
    if (!intervaloDias || Number(intervaloDias) <= 0) return alert('Intervalo válido obrigatório');

    try {
      console.log('Iniciando salvamento com user_id:', user.id);
      console.log('Preview parcelas:', previewParcelas);

      for (const [index, p] of previewParcelas.entries()) {
        const [ano, mes, dia] = dataVencimento.split('-');
        const baseDate = new Date(Number(ano), Number(mes) - 1, Number(dia));
        baseDate.setDate(baseDate.getDate() + (Number(intervaloDias) * index));
        baseDate.setHours(3, 0, 0, 0); // Compensação BRT

        const anoV = baseDate.getUTCFullYear();
        const mesV = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
        const diaV = String(baseDate.getUTCDate()).padStart(2, '0');
        const dataVencStr = `${anoV}-${mesV}-${diaV}`;

        console.log(`Inserindo parcela ${index + 1}:`, { dataVencStr, valor: p.valor });

        const { error } = await supabase.from('contas_pagar').insert({
          user_id: user.id,
          fornecedor_id: fornecedorSelecionado.id,
          fatura: `${fatura.toUpperCase()}-${index + 1}/${previewParcelas.length}`,
          valor_total: Number(valorTotal),
          valor_parcela: p.valor,
          parcelas: previewParcelas.length,
          parcela_atual: index + 1,
          data_vencimento: dataVencStr,
          pago: false,
          categoria: categoriaSelecionada,
          observacoes: observacoes || null,
        });

        if (error) {
          console.error('Erro na parcela', index + 1, ':', error);
          throw error;
        }
      }

      alert('Conta a pagar criada com sucesso!');
      router.push('/contas-pagar');
    } catch (error: any) {
      console.error('Erro completo ao salvar:', error);
      alert('Erro ao salvar conta: ' + (error.message || 'Verifique o console do navegador'));
    }
  };

  if (!user) return null;

  return (
    <div className="p-12">
      <h1 className="text-5xl font-bold text-red-400 mb-12">Nova Conta a Pagar</h1>

      <div className="bg-gray-900 rounded-3xl p-12 max-w-4xl mx-auto">
        {/* ... (o resto do JSX igual ao anterior, com o select de categoria) */}
        {/* O importante é o handleSalvar corrigido acima */}
      </div>

      {/* Modal novo fornecedor igual */}
    </div>
  );
}