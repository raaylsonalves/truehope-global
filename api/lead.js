// ============================================================================
// POST /api/lead
// Recebe o lead do formulário da masterclass, envia o e-mail de confirmação
// pelo SMTP do domínio TRUEHOPE e grava a linha numa planilha Google (via
// Apps Script — ver apps-script/gravar-lead.gs — sem service account/chave).
//
// Variáveis de ambiente (configurar no painel da Vercel → Settings → Environment
// Variables — nunca commitar valores reais):
//
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE ("true"/"false"), SMTP_USER, SMTP_PASS
//   SMTP_FROM           ex.: "TRUEHOPE <contato@truehope.com.br>"
//
//   LEAD_SHEET_WEBHOOK   a URL /exec do Apps Script (apps-script/gravar-lead.gs)
//
//   CUPOM_CODE           opcional — padrão "TRUEHOPE15" (cupom único
//                        compartilhado; ver nota no fim do arquivo)
//   LINK_COLECAO         opcional — padrão usa o link da loja já embutido no site
//   LINK_COMUNIDADE      link do grupo/comunidade no WhatsApp
//   LINK_DESCADASTRO     opcional
// ============================================================================

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const LINK_COLECAO_PADRAO =
  'https://www.marcioficial.com.br/?ltclid=81ee7a1d-83a6-41f4-abc6-8d9ce375c7a1&utm_source=ig&utm_medium=social&utm_content=link_in_bio';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });
  }

  var lead = req.body || {};
  var nome = String(lead.nome || '').trim();
  var email = String(lead.email || '').trim();

  if (!nome || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ ok: false, erro: 'Nome e e-mail válidos são obrigatórios.' });
  }

  var resultado = { ok: true, planilha: false, email: false };

  // -------------------------------------------------------------- planilha
  try {
    await gravarNaPlanilha(lead);
    resultado.planilha = true;
  } catch (erro) {
    console.error('[lead] falha ao gravar na planilha:', erro);
  }

  // ------------------------------------------------------------- e-mail
  try {
    await enviarEmailConfirmacao(lead);
    resultado.email = true;
  } catch (erro) {
    console.error('[lead] falha ao enviar e-mail:', erro);
  }

  // O formulário já mostra a confirmação na tela mesmo se algo aqui falhar
  // (o lead não pode se perder por causa de uma planilha ou SMTP fora do ar) —
  // por isso sempre 200, com o detalhe do que funcionou em `resultado`.
  return res.status(200).json(resultado);
};

async function gravarNaPlanilha(lead) {
  if (!process.env.LEAD_SHEET_WEBHOOK) throw new Error('LEAD_SHEET_WEBHOOK não configurado.');

  var r = await fetch(process.env.LEAD_SHEET_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead)
  });
  // o Apps Script às vezes responde com um redirect 302 para o resultado —
  // fetch segue redirects por padrão, então só o !ok importa de fato.
  if (!r.ok) throw new Error('Apps Script respondeu ' + r.status);
}

async function enviarEmailConfirmacao(lead) {
  if (!process.env.SMTP_HOST) throw new Error('SMTP_HOST não configurado.');

  var transportador = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  var primeiroNome = (lead.nome || '').trim().split(/\s+/)[0] || '';

  var pastaEmail = path.join(process.cwd(), 'assets', 'email');
  var html = fs.readFileSync(path.join(pastaEmail, 'convocacao-recebida.html'), 'utf8');

  html = html
    .split('{{PRIMEIRO_NOME}}').join(primeiroNome)
    .split('{{CUPOM}}').join(process.env.CUPOM_CODE || 'TRUEHOPE15')
    .split('{{LINK_COLECAO}}').join(process.env.LINK_COLECAO || LINK_COLECAO_PADRAO)
    .split('{{LINK_COMUNIDADE}}').join(process.env.LINK_COMUNIDADE || '#')
    .split('{{LINK_DESCADASTRO}}').join(process.env.LINK_DESCADASTRO || '#');

  await transportador.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: lead.email,
    subject: 'Sua vaga na Convocação pelo Resgate da Família está confirmada',
    html: html,
    // imagens embutidas como anexo inline (cid:) — funcionam em qualquer
    // caixa de entrada, sem depender de um domínio publicado nem de o
    // destinatário clicar em "exibir imagens".
    attachments: [
      { filename: 'logo-th.png', path: path.join(pastaEmail, 'img', 'logo-th.png'), cid: 'logo-th' },
      { filename: 'foto-camisa.jpg', path: path.join(pastaEmail, 'img', 'foto-camisa.jpg'), cid: 'foto-camisa' },
      { filename: 'foto-bordado.jpg', path: path.join(pastaEmail, 'img', 'foto-bordado.jpg'), cid: 'foto-bordado' }
    ]
  });
}

// ----------------------------------------------------------------------------
// Nota sobre o cupom: CUPOM_CODE hoje é um único código compartilhado por
// todo mundo que preenche o formulário (o mesmo que já está no rodapé da
// coleção do site). Se a Marci quiser rastrear resgates por pessoa, cada
// e-mail precisaria de um código único gerado aqui e gravado na planilha —
// é uma mudança pequena, mas depende da ferramenta de cupom que a loja usa.
// ----------------------------------------------------------------------------
