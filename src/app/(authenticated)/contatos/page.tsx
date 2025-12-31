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
  endereco?: string;
  cep?: string;
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
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
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

  const loadContatos = async (userId: string) => {
    const { data: cli } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', userId)
      .order('nome');

    const { data: forn } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('user_id', userId)
      .order('nome');

    setClientes((cli || []).map(c => ({ ...c, type: 'cliente' as ContatoType })));
    setFornecedores((forn || []).map(f => ({ ...f, type: 'fornecedor' as ContatoType })));
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
      setEndereco(`${data.logradouro || ''}, ${data.complemento || ''}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
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
      endereco: endereco || null,
      cep: cep || null,
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
    setNome('');
    setCodigo('');
    setRecorrente(false);
    setValorMensal('');
    setDiaVencimento('1');
    setFrequencia('mensal');
    setParcelasTotais('0');
    setEndereco('');
    setCep('');
    setTelefoneFixo('');
    setTelefoneCelular('');
    setEmailContato('');
    setCpfCnpj('');
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
    setEndereco(contato.endereco || '');
    setCep(contato.cep || '');
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
          onClick={() => {
            resetForm();
            setModalAberto(true);
          }}
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

      {/* Lista de contatos (mesmo do anterior) */}
      {/* ... código da lista ... */}

      {/* Modal completo com campos extras */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-3xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-4xl font-bold mb-8">
              {editando ? 'Editar' : 'Novo'} {tipoNovo === 'cliente' ? 'Cliente' : 'Fornecedor'}
            </h2>

            {/* ... campos existentes ... */}

            {/* Novos campos */}
            <div className="mt-12 grid md:grid-cols-2 gap-8">
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
              <div>
                <label className="block text-xl mb-2">Endereço</label>
                <input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full p-4 bg-gray-800 rounded-lg"
                />
              </div>
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

            {/* Botões salvar/cancelar */}
          </div>
        </div>
      )}
    </div>
  );
}