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

  // Form states
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [valorMensal, setValorMensal] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('1');
  const [frequencia, setFrequencia] = useState('mensal');
  const [parcelasTotais, setParcelasTotais] = useState('0');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [telefoneFixo, setTelefoneFixo] = useState('');
  const [telefoneCelular, setTelefoneCelular] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');

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
    loadContatos(user?.id);
  }, [aba]);

  const loadContatos = async (userId: string) => {
    if (!userId) return;

    const tabela = aba === 'clientes' ? 'clientes' : 'fornecedores';

    const { data } = await supabase
      .from(tabela)
      .select('*')
      .eq('user_id', userId)
      .order('nome');

    if (aba === 'clientes') {
      setClientes((data || []).map(c => ({ ...c, type: 'cliente' as ContatoType })));
    } else {
      setFornecedores((data || []).map(f => ({ ...f, type: 'fornecedor' as ContatoType })));
    }
  };

  const handleCepBlur = async () => {
    if (cep.length < 8) return;

    const cepLimpo = cep.replace(/\D/g, '');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) {
        alert('CEP inválido');
        return;
      }
      setLogradouro(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setUf(data.uf || '');
    } catch {
      alert('Erro ao buscar CEP');
    }
  };

  const handleSalvar = async () => {
    if (!nome || !codigo) {
      alert('Preencha nome e código');
      return;
    }

    const tabela = tipoNovo === 'cliente' ? 'clientes' : 'fornecedores';

    const dados = {
      user_id: user.id,
      nome: nome.toUpperCase(),
      codigo: codigo.toUpperCase(),
      recorrente,
      valor_mensal: recorrente ? Number(valorMensal || 0) : 0,
      dia_vencimento: recorrente ? Number(diaVencimento) : 1,
      frequencia: recorrente ? frequencia : 'mensal',
      parcelas_totais: recorrente ? Number(parcelasTotais || 0) : 0,
      ativo: true,
      cep: cep || null,
      logradouro: logradouro || null,
      numero: numero || null,
      bairro: bairro || null,
      cidade: cidade || null,
      uf: uf || null,
      telefone_fixo: telefoneFixo || null,
      telefone_celular: telefoneCelular || null,
      email: emailContato || null,
      cpf_cnpj: cpfCnpj || null,
    };

    if (editando) {
      const { error } = await supabase
        .from(tabela)
        .update(dados)
        .eq('id', editando.id);

      if (error) {
        alert('Erro ao salvar: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from(tabela)
        .insert(dados);

      if (error) {
        alert('Erro ao salvar: ' + error.message);
        return;
      }
    }

    resetForm();
    loadContatos(user.id);
  };

  const resetForm = () => {
    setModalAberto(false);
    setEditando(null);
    setTipoNovo('cliente');
    setNome('');
    setCodigo('');
    setRecorrente(false);
    setValorMensal('');
    setDiaVencimento('1');
    setFrequencia('mensal');
    setParcelasTotais('0');
    setCep('');
    setLogradouro('');
    setNumero('');
    setBairro('');
    setCidade('');
    setUf('');
    setTelefoneFixo('');
    setTelefoneCelular('');
    setEmailContato('');
    setCpfCnpj('');
  };

  const abrirNovo = () => {
    resetForm();
    setModalAberto(true);
  };

  const abrirEdicao = (contato: Contato) => {
    setEditando(contato);
    setTipoNovo(contato.type);
    setNome(contato.nome);
    setCodigo(contato.codigo);
    setRecorrente(contato.recorrente);
    setValorMensal(contato.valor_mensal?.toString() || '');
    setDiaVencimento(contato.dia_vencimento?.toString() || '1');
    setFrequencia(contato.frequencia || 'mensal');
    setParcelasTotais(contato.parcelas_totais?.toString() || '0');
    setCep(contato.cep || '');
    setLogradouro(contato.logradouro || '');
    setNumero(contato.numero || '');
    setBairro(contato.bairro || '');
    setCidade(contato.cidade || '');
    setUf(contato.uf || '');
    setTelefoneFixo(contato.telefone_fixo || '');
    setTelefoneCelular(contato.telefone_celular || '');
    setEmailContato(contato.email || '');
    setCpfCnpj(contato.cpf_cnpj || '');
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

      {/* Modal corrigido */}
      {modalAberto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => resetForm()}
        >
          <div 
            className="bg-gray-900 p-8 rounded-3xl max-w-4xl w-full max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-4xl font-bold mb-8">
              {editando ? 'Editar' : 'Novo'} {tipoNovo === 'cliente' ? 'Cliente' : 'Fornecedor'}
            </h2>

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
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">Código (4 caracteres)</label>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 4))}
                  maxLength={4}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
            </div>

            {/* Endereço com CEP auto */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <label className="block text-xl mb-2">CEP (auto-complete)</label>
                <input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xl mb-2">Logradouro (rua/av.)</label>
                <input
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">Número</label>
                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">Bairro</label>
                <input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">Cidade</label>
                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">UF</label>
                <input
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
            </div>

            {/* Outros campos */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-xl mb-2">Telefone Fixo</label>
                <input
                  value={telefoneFixo}
                  onChange={(e) => setTelefoneFixo(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">Telefone Celular</label>
                <input
                  value={telefoneCelular}
                  onChange={(e) => setTelefoneCelular(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">E-mail</label>
                <input
                  type="email"
                  value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xl mb-2">CPF/CNPJ</label>
                <input
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
            </div>

            {/* Recorrência */}
            <div className="mt-8">
              <label className="flex items-center gap-4 text-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={recorrente}
                  onChange={(e) => setRecorrente(e.target.checked)}
                  className="w-6 h-6"
                />
                Gerar contas recorrentes
              </label>
            </div>

            {recorrente && (
              <div className="mt-8 grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xl mb-2">Valor mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={valorMensal}
                    onChange={(e) => setValorMensal(e.target.value)}
                    className="w-full p-4 bg-gray-800 rounded-lg"
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
                    className="w-full p-4 bg-gray-800 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xl mb-2">Frequência</label>
                  <select
                    value={frequencia}
                    onChange={(e) => setFrequencia(e.target.value)}
                    className="w-full p-4 bg-gray-800 rounded-lg"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xl mb-2">Parcelas totais (0 = ilimitado)</label>
                  <input
                    type="number"
                    min="0"
                    value={parcelasTotais}
                    onChange={(e) => setParcelasTotais(e.target.value)}
                    className="w-full p-4 bg-gray-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-end gap-6">
              <button
                onClick={resetForm}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xl"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}