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
  const [codigoAlterado, setCodigoAlterado] = useState(false);
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
    const tabelaContato = tipoNovo === 'cliente' ? 'clientes' : 'fornecedores';
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
        .from(tabelaContato)
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

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">Endereço</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-xl mb-2">CEP</label>
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className="w-full p-4 bg-gray-800 rounded-lg text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xl mb-2">Logradouro</label>
                  <input
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    className="w-full p-4 bg-gray-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2">Número</label>
                  <input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full p-4 bg-gray-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2">Complemento</label>
                  <input
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    maxLength={30}
                    className="w-full p-4 bg-gray-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2">Bairro</label>
                  <input
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full p-4 bg-gray-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2">Cidade</label>
                  <input
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full p-4 bg-gray-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2">UF</label>
                  <input
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full p-4 bg-gray-800 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-xl mb-2">Telefone Fixo</label>
                <input
                  value={telefoneFixo}
                  onChange={(e) => setTelefoneFixo(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">Telefone Celular</label>
                <input
                  value={telefoneCelular}
                  onChange={(e) => setTelefoneCelular(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">E-mail</label>
                <input
                  type="email"
                  value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">CPF/CNPJ</label>
                <input
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg text-white"
                />
              </div>
            </div>

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
                        onChange={(e) => setParcelasTotais(e.target.value)}
                        className="w-full p-4 bg-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-6">
                    <button
                      onClick={handleCancelarRecorrencia}
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