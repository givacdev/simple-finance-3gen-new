// supabase/functions/gerar-recorrentes/index.ts

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async () => {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const anoAtual = hoje.getFullYear()
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0')

  console.log(`Iniciando geração de parcelas recorrentes em ${hoje.toISOString().split('T')[0]}`)

  try {
    // Processa clientes recorrentes
    const { data: clientes } = await supabase
      .from('clientes')
      .select('*')
      .eq('recorrente', true)
      .eq('ativo', true)

    for (const cliente of clientes || []) {
      await gerarParcela(cliente, 'clientes', 'contas_receber', 'REC')
    }

    // Processa fornecedores recorrentes
    const { data: fornecedores } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('recorrente', true)
      .eq('ativo', true)

    for (const fornecedor of fornecedores || []) {
      await gerarParcela(fornecedor, 'fornecedores', 'contas_pagar', 'PAG')
    }

    return new Response(JSON.stringify({ success: true, message: 'Parcelas recorrentes geradas com sucesso' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Erro na função:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function gerarParcela(contato: any, tabelaContato: string, tabelaConta: string, prefixoFatura: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  let proximaData: Date

  if (contato.data_proxima_parcela) {
    proximaData = new Date(contato.data_proxima_parcela)
  } else {
    // Primeira execução: calcula com base no dia_vencimento
    const dia = contato.dia_vencimento
    proximaData = new Date(hoje.getFullYear(), hoje.getMonth(), dia)

    // Se o dia já passou este mês, vai pro próximo
    if (proximaData < hoje) {
      proximaData.setMonth(proximaData.getMonth() + 1)
      // Ajusta se o mês mudou para dezembro → janeiro
      if (proximaData.getDate() !== dia) {
        proximaData = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia)
      }
    }
  }

  // Se a próxima parcela não é hoje ou anterior, pula
  if (proximaData > hoje) return

  // Gera número da fatura único
  const ano = proximaData.getFullYear()
  const mes = String(proximaData.getMonth() + 1).padStart(2, '0')
  const fatura = `${prefixoFatura}-${contato.codigo}-${ano}-${mes}`

  // Verifica duplicidade
  const chaveId = tabelaContato === 'clientes' ? 'cliente_id' : 'fornecedor_id'

  const { data: existente } = await supabase
    .from(tabelaConta)
    .select('id')
    .eq('fatura', fatura)
    .eq(chaveId, contato.id)
    .limit(1)

  if (existente && existente.length > 0) {
    console.log(`Parcela já existe: ${fatura}`)
    return
  }

  // Cria a conta recorrente
  const dadosConta = {
    user_id: contato.user_id,
    [chaveId]: contato.id,
    fatura,
    valor_total: contato.valor_mensal,
    parcelas: 1,
    parcela_atual: 1,
    valor_parcela: contato.valor_mensal,
    data_vencimento: proximaData.toISOString().split('T')[0],
    observacoes: `Recorrência automática - ${contato.nome}`,
  }

  const { error: erroInsert } = await supabase.from(tabelaConta).insert(dadosConta)

  if (erroInsert) {
    console.error(`Erro ao criar conta para ${contato.nome}:`, erroInsert)
    return
  }

  console.log(`Parcela criada: ${fatura} - R$ ${contato.valor_mensal}`)

  // Calcula próxima data
  let novaProxima = new Date(proximaData)

  if (contato.frequencia === 'semanal') {
    novaProxima.setDate(novaProxima.getDate() + 7)
  } else if (contato.frequencia === 'quinzenal') {
    novaProxima.setDate(novaProxima.getDate() + 14)
  } else { // mensal
    novaProxima.setMonth(novaProxima.getMonth() + 1)
    // Corrige se o dia não existe no próximo mês (ex: 31)
    if (novaProxima.getDate() !== contato.dia_vencimento) {
      novaProxima = new Date(novaProxima.getFullYear(), novaProxima.getMonth() + 1, 0) // último dia do mês
    }
  }

  // Atualiza data_proxima_parcela no contato
  await supabase
    .from(tabelaContato)
    .update({ data_proxima_parcela: novaProxima.toISOString().split('T')[0] })
    .eq('id', contato.id)
}