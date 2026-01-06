'use client';

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ContatoType = 'cliente' | 'fornecedor';

interface Contato {
  id: string;
  nome: string;
  codigo: string;
  recorrente: boolean;
  valor_mensal: number;
  dia_vencimento: number;
  frequencia: string;
  parcelas_totais: number;
  ativo: boolean;
  type: ContatoType;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefone_fixo?: string;
  telefone_celular?: string;
  email?: string;
  cpf_cnpj?: string;
}

export default function Contatos() {
  const [user, setUser] = useState<any>(null);
  const [clientes, setClientes] = useState<Contato[]>([]);
  const [fornecedores, setFornecedores] = useState<Contato[]>([]);
  const [aba, setAba] = useState<'clientes' | 'fornecedores'>('clientes');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Contato | null>(null);
  const [tipoNovo, setTipoNovo] = useState<ContatoType>('cliente');
  const router = useRouter();

  // Form states - dados gerais
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [telefoneFixo, setTelefoneFixo] = useState('');
  const [telefoneCelular, setTelefoneCelular] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');

  // Form states - recorrência
  const [recorrente, setRecorrente] = useState(false);
  const [valorMensal, setValorMensal] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('1');
  const [frequencia, setFrequencia] = useState('mensal');
  const [parcelasTotais, setParcelasTotais] = useState('0');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      loadContatos(data.session.user.id);
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (user) loadContatos(user.id);
  }, [aba, user]);

  const loadContatos = async (userId: string) => {
    if (!userId) return;

    const tabela = aba === 'clientes' ? 'clientes' : 'fornecedores';

    const { data } = await supabase
      .from(tabela)
      .select('*')
      .eq('user_id', userId)
      .order('nome', { ascending: true });

    if (aba === 'clientes') {
      setClientes((data || []).map(c => ({ ...c, type: 'cliente' as ContatoType })));
    } else {
      setFornecedores((data || []).map(f => ({ ...f, type: 'fornecedor' as ContatoType })));
    }
  };

  const handleCepBlur = async () => {
    if (cep.replace(/\D/g, '').length < 8) return;

    const cepLimpo = cep.replace(/\D/g, '');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) {
        alert('CEP não encontrado');
        return;
      }
      setLogradouro(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setUf(data.uf || '');
      setComplemento(data.complemento || '');
    } catch {
      alert('Erro ao buscar CEP');
    }
  };

  const handleSalvarContato = async () => {
    if (!nome.trim() || !codigo.trim()) {
      alert('Nome e código são obrigatórios');
      return;
    }

    const tabela = tipoNovo === 'cliente' ? 'clientes' : 'fornecedores';

    const dados = {
      user_id: user.id,
      nome: nome.toUpperCase().trim(),
      codigo: codigo.toUpperCase().trim(),
      cep: cep.trim() || null,
      logradouro: logradouro.trim() || null,
      numero: numero.trim() || null,
      complemento: complemento.trim() || null,
      bairro: bairro.trim() || null,
      cidade: cidade.trim() || null,
      uf: uf.toUpperCase().trim() || null,
      telefone_fixo: telefoneFixo.trim() || null,
      telefone_celular: telefoneCelular.trim() || null,
      email: emailContato.trim() || null,
      cpf_cnpj: cpfCnpj.trim() || null,
    };

    try {
      if (editando) {
        const { error } = await supabase
          .from(tabela)
          .update(dados)
          .eq('id', editando.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from(tabela).insert(dados);
        if (error) throw error;
      }

      alert('Contato salvo com sucesso!');
      resetForm();
      loadContatos(user.id);
    } catch (error: any) {
      alert('Erro ao salvar contato: ' + error.message);
    }
  };

  const handleSalvarRecorrencia = async () => {
    if (!editando && !user) {
      alert('Salve o contato primeiro');
      return;
    }

    const contatoId = editando?.id;
    const tabelaContato = tipoNovo === 'cliente' ? 'clientes' : 'fornecedores';
    const tabelaConta = tipoNovo === 'cliente' ? 'contas_receber' : 'contas_pagar';
    const prefixoFatura = tipoNovo === 'cliente' ? 'REC' : 'PAG';

    const dadosRecorrencia = {
      recorrente: true,
      valor_mensal: Number(valorMensal || 0),
      dia_vencimento: Number(diaVencimento),
      frequencia,
      parcelas_totais: Number(parcelasTotais || 0),
    };

    try {
      // Atualiza configuração recorrente
      const { error: errorUpdate } = await supabase
        .from(tabelaContato)
        .update(dadosRecorrencia)
        .eq('id', contatoId);

      if (errorUpdate) throw errorUpdate;

      // Gera até 12 parcelas futuras
      let dataVencimento = new Date();
      const dia = Number(diaVencimento);
      dataVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dia);

      // Se o dia já passou este mês, vai pro próximo
      if (dataVencimento < new Date()) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }

      const maxParcelas = 12;
      let parcelasGeradas = 0;

      while (parcelasGeradas < maxParcelas && (Number(parcelasTotais) === 0 || parcelasGeradas < Number(parcelasTotais))) {
        const ano = dataVencimento.getFullYear();
        const mes = String(dataVencimento.getMonth() + 1).padStart(2, '0');
        const fatura = `${prefixoFatura}-${editando?.codigo}-${ano}-${mes}-${String(parcelasGeradas + 1).padStart(2, '0')}`;

        // Verifica duplicidade
        const { data: existente } = await supabase
          .from(tabelaConta)
          .select('id')
          .eq('fatura', fatura)
          .limit(1);

        if (existente?.length > 0) {
          // Próxima parcela
          dataVencimento.setMonth(dataVencimento.getMonth() + 1);
          continue;
        }

        // Insere parcela
        await supabase.from(tabelaConta).insert({
          user_id: user.id,
          [tipoNovo === 'cliente' ? 'cliente_id' : 'fornecedor_id']: contatoId,
          fatura,
          valor_total: Number(valorMensal),
          valor_parcela: Number(valorMensal),
          parcelas: 1,
          parcela_atual: 1,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          observacoes: 'Recorrência gerada automaticamente',
        });

        parcelasGeradas++;
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }

      alert(`Recorrência salva e ${parcelasGeradas} parcelas geradas com sucesso!`);
      loadContatos(user.id);
    } catch (error: any) {
      alert('Erro ao salvar recorrência: ' + error.message);
    }
  };

  const resetForm = () => {
    setModalAberto(false);
    setEditando(null);
    setTipoNovo('cliente');
    setNome('');
    setCodigo('');
    setCep('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setUf('');
    setTelefoneFixo('');
    setTelefoneCelular('');
    setEmailContato('');
    setCpfCnpj('');
    setRecorrente(false);
    setValorMensal('');
    setDiaVencimento('1');
    setFrequencia('mensal');
    setParcelasTotais('0');
  };

  const abrirNovo = () => {
    resetForm();
    setModalAberto(true);
  };

  const abrirEdicao = (contato: Contato) => {
    setEditando(contato);
    setTipoNovo(contato.type);
    setNome(contato.nome || '');
    setCodigo(contato.codigo || '');
    setCep(contato.cep || '');
    setLogradouro(contato.logradouro || '');
    setNumero(contato.numero || '');
    setComplemento(contato.complemento || '');
    setBairro(contato.bairro || '');
    setCidade(contato.cidade || '');
    setUf(contato.uf || '');
    setTelefoneFixo(contato.telefone_fixo || '');
    setTelefoneCelular(contato.telefone_celular || '');
    setEmailContato(contato.email || '');
    setCpfCnpj(contato.cpf_cnpj || '');
    setRecorrente(contato.recorrente || false);
    setValorMensal(contato.valor_mensal?.toString() || '');
    setDiaVencimento(contato.dia_vencimento?.toString() || '1');
    setFrequencia(contato.frequencia || 'mensal');
    setParcelasTotais(contato.parcelas_totais?.toString() || '0');
    setModalAberto(true);
  };

  const toggleAtivo = async (contato: Contato) => {
    const tabela = contato.type === 'cliente' ? 'clientes' : 'fornecedores';

    const { error } = await supabase
      .from(tabela)
      .update({ ativo: !contato.ativo })
      .eq('id', contato.id);

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      loadContatos(user.id);
    }
  };

  if (!user) return null;

  const listaAtual = aba === 'clientes' ? clientes : fornecedores;

  return (
    <div className="p-12">
      {/* ... código da header, abas e lista (igual ao anterior) ... */}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div className="bg-gray-900 p-8 rounded-3xl max-w-4xl w-full max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* ... código do modal geral (nome, código, endereço, contatos) ... */}

            {/* Área de recorrência com botões próprios */}
            <div className="mt-12">
              <label className="flex items-center gap-4 text-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={recorrente}
                  onChange={(e) => setRecorrente(e.target.checked)}
                  className="w-6 h-6"
                />
                Gerar contas recorrentes
              </label>

              {recorrente && (
                <div className="mt-8 p-8 bg-gray-800 rounded-2xl">
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <label className="block text-xl mb-2">Valor mensal (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={valorMensal}
                        onChange={(e) => setValorMensal(e.target.value)}
                        className="w-full p-4 bg-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xl mb-2">Dia do vencimento</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={diaVencimento}
                        onChange={(e) => setDiaVencimento(e.target.value)}
                        className="w-full p-4 bg-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xl mb-2">Frequência</label>
                      <select
                        value={frequencia}
                        onChange={(e) => setFrequencia(e.target.value)}
                        className="w-full p-4 bg-gray-700 rounded-lg text-white"
                      >
                        <option value="mensal">Mensal</option>
                        <option value="quinzenal">Quinzenal</option>
                        <option value="semanal">Semanal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xl mb-2">Parcelas totais (0 = ilimitado, máx 12)</label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={parcelasTotais}
                        onChange={(e) => setParcelasTotais(e.target.value > 12 ? '12' : e.target.value)}
                        className="w-full p-4 bg-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-6">
                    <button
                      onClick={() => setRecorrente(false)}
                      className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
                    >
                      Cancelar Recorrência
                    </button>
                    <button
                      onClick={handleSalvarRecorrencia}
                      className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xl"
                    >
                      Salvar Recorrência
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-end gap-6">
              <button
                onClick={resetForm}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarContato}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xl"
              >
                Salvar Contato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}