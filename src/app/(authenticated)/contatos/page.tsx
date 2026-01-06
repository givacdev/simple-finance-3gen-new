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
  const [temParcelasPendentes, setTemParcelasPendentes] = useState(false);
  const [codigoAlterado, setCodigoAlterado] = useState(false); // novo para travar recorrência
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

  const abrirEdicao = async (contato: Contato) => {
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
    setCodigoAlterado(false);

    // Verifica parcelas pendentes para travar código
    const tabelaConta = contato.type === 'cliente' ? 'contas_receber' : 'contas_pagar';
    const keyId = contato.type === 'cliente' ? 'cliente_id' : 'fornecedor_id';

    const { data: parcelas } = await supabase
      .from(tabelaConta)
      .select('id')
      .eq(keyId, contato.id)
      .eq(contato.type === 'cliente' ? 'recebido' : 'pago', false);

    setTemParcelasPendentes((parcelas || []).length > 0);

    setModalAberto(true);
  };

  const handleSalvarContato = async () => {
    if (!nome.trim() || !codigo.trim()) {
      alert('Nome e código são obrigatórios');
      return;
    }

    if (codigo !== editando?.codigo) {
      setCodigoAlterado(true);
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
        const { data, error } = await supabase
          .from(tabela)
          .insert(dados)
          .select()
          .single();

        if (error) throw error;
        setEditando({ ...data, type: tipoNovo } as Contato);
      }

      alert('Contato salvo com sucesso!');
      setCodigoAlterado(false);
      loadContatos(user.id);
    } catch (error: any) {
      alert('Erro ao salvar contato: ' + error.message);
    }
  };

  const handleSalvarRecorrencia = async () => {
    if (!editando) {
      alert('Salve o contato primeiro');
      return;
    }

    if (codigoAlterado) {
      alert('Salve a edição do código do contato antes de salvar a recorrência');
      return;
    }

    const contatoId = editando.id;
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
      const { error } = await supabase
        .from(tabelaContato)
        .update(dadosRecorrencia)
        .eq('id', contatoId);

      if (error) throw error;

      let dataVencimento = new Date();
      dataVencimento.setDate(Number(diaVencimento));

      if (dataVencimento < new Date()) {
        if (frequencia === 'semanal') {
          dataVencimento.setDate(dataVencimento.getDate() + 7);
        } else if (frequencia === 'quinzenal') {
          dataVencimento.setDate(dataVencimento.getDate() + 15);
        } else {
          dataVencimento.setMonth(dataVencimento.getMonth() + 1);
        }
      }

      const maxParcelas = 12;
      let parcelasGeradas = 0;

      for (let i = 0; i < maxParcelas; i++) {
        const ano = dataVencimento.getFullYear();
        const mes = String(dataVencimento.getMonth() + 1).padStart(2, '0');
        const fatura = `${prefixoFatura}-${editando.codigo}-${ano}-${mes}`;

        const { data: existente } = await supabase
          .from(tabelaConta)
          .select('id')
          .eq('fatura', fatura)
          .limit(1);

        if (existente && existente.length > 0) {
          if (frequencia === 'semanal') {
            dataVencimento.setDate(dataVencimento.getDate() + 7);
          } else if (frequencia === 'quinzenal') {
            dataVencimento.setDate(dataVencimento.getDate() + 15);
          } else {
            dataVencimento.setMonth(dataVencimento.getMonth() + 1);
          }
          continue;
        }

        await supabase.from(tabelaConta).insert({
          user_id: user.id,
          [tipoNovo === 'cliente' ? 'cliente_id' : 'fornecedor_id']: contatoId,
          fatura,
          valor_total: Number(valorMensal),
          valor_parcela: Number(valorMensal),
          parcelas: 1,
          parcela_atual: 1,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          observacoes: 'Recorrência gerada',
        });

        parcelasGeradas++;

        if (frequencia === 'semanal') {
          dataVencimento.setDate(dataVencimento.getDate() + 7);
        } else if (frequencia === 'quinzenal') {
          dataVencimento.setDate(dataVencimento.getDate() + 15);
        } else {
          dataVencimento.setMonth(dataVencimento.getMonth() + 1);
        }
      }

      alert(`Recorrência salva e ${parcelasGeradas} parcelas geradas com sucesso!`);
      loadContatos(user.id);
    } catch (error: any) {
      alert('Erro ao salvar recorrência: ' + error.message);
    }
  };

  const handleCancelarRecorrencia = async () => {
    if (!editando) return;

    const tabelaConta = tipoNovo === 'cliente' ? 'contas_receber' : 'contas_pagar';
    const keyId = tipoNovo === 'cliente' ? 'cliente_id' : 'fornecedor_id';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    try {
      const { error: errorDelete } = await supabase
        .from(tabelaConta)
        .delete()
        .eq(keyId, editando.id)
        .eq(tipoNovo === 'cliente' ? 'recebido' : 'pago', false)
        .gt('data_vencimento', hoje.toISOString().split('T')[0]);

      if (errorDelete) throw errorDelete;

      const { error: errorUpdate } = await supabase
        .from(tipoNovo === 'cliente' ? 'clientes' : 'fornecedores')
        .update({ recorrente: false })
        .eq('id', editando.id);

      if (errorUpdate) throw errorUpdate;

      alert('Recorrência cancelada e parcelas futuras deletadas com sucesso!');
      setRecorrente(false);
      loadContatos(user.id);
    } catch (error: any) {
      alert('Erro ao cancelar recorrência: ' + error.message);
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
    setTemParcelasPendentes(false);
    setCodigoAlterado(false);
  };

  const abrirNovo = () => {
    resetForm();
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold">Contatos</h1>
        <button
          onClick={abrirNovo}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-xl"
        >
          + Novo Contato
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setAba('clientes')}
          className={`px-8 py-4 rounded-xl font-bold text-xl ${aba === 'clientes' ? 'bg-green-600' : 'bg-gray-700'}`}
        >
          Clientes
        </button>
        <button
          onClick={() => setAba('fornecedores')}
          className={`px-8 py-4 rounded-xl font-bold text-xl ${aba === 'fornecedores' ? 'bg-red-600' : 'bg-gray-700'}`}
        >
          Fornecedores
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {listaAtual.length === 0 ? (
            <p className="p-12 text-center text-gray-400 text-2xl">
              Nenhum {aba === 'clientes' ? 'cliente' : 'fornecedor'} cadastrado.
            </p>
          ) : (
            listaAtual.map((contato) => (
              <div key={contato.id} className="p-8 hover:bg-gray-800 transition flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{contato.nome} ({contato.codigo})</p>
                  {contato.recorrente && (
                    <p className="text-gray-400 mt-2">
                      Recorrente: R$ {Number(contato.valor_mensal).toFixed(2)} todo dia {contato.dia_vencimento} ({contato.frequencia})
                      {contato.parcelas_totais > 0 && ` • ${contato.parcelas_totais} parcelas`}
                    </p>
                  )}
                  <p className={`mt-2 ${contato.ativo ? 'text-green-400' : 'text-red-400'}`}>
                    Status: {contato.ativo ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => abrirEdicao(contato)}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(contato)}
                    className={`${contato.ativo ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} px-6 py-3 rounded-xl font-bold`}
                  >
                    {contato.ativo ? 'Pausar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-3xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-bold">
                {editando ? 'Editar' : 'Novo'} {tipoNovo === 'cliente' ? 'Cliente' : 'Fornecedor'}
              </h2>
              <button
                onClick={resetForm}
                className="text-4xl text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {!editando && (
              <div className="mb-8">
                <label className="block text-xl mb-4">Tipo de contato</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTipoNovo('cliente')}
                    className={`flex-1 py-4 rounded-xl font-bold text-xl ${tipoNovo === 'cliente' ? 'bg-green-600' : 'bg-gray-700'}`}
                  >
                    Cliente
                  </button>
                  <button
                    onClick={() => setTipoNovo('fornecedor')}
                    className={`flex-1 py-4 rounded-xl font-bold text-xl ${tipoNovo === 'fornecedor' ? 'bg-red-600' : 'bg-gray-700'}`}
                  >
                    Fornecedor
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-xl mb-2">Nome completo *</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg text-white"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">Código (4 caracteres) *</label>
                <input
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.toUpperCase().slice(0, 4));
                    setCodigoAlterado(e.target.value.toUpperCase() !== editando?.codigo);
                  }}
                  maxLength={4}
                  disabled={temParcelasPendentes}
                  className={`w-full p-4 bg-gray-800 rounded-lg text-white ${temParcelasPendentes ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="EX: CL01"
                />
                {temParcelasPendentes && (
                  <p className="text-red-400 text-sm mt-2">Código não pode ser alterado (há parcelas pendentes)</p>
                )}
              </div>
            </div>

            {/* ... resto do modal (endereço, contatos, recorrência) igual ao anterior ... */}
          </div>
        </div>
      )}
    </div>
  );
}