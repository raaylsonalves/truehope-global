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
//   LEAD_SHEET_WEBHOOK   a URL /exec do Apps Script (apps-script/gravar-lead.gs).
//                        ATENÇÃO: precisa ser a URL de uma implantação com
//                        acesso "Qualquer pessoa". Se a URL tiver o trecho
//                        /a/macros/<domínio>/ ela está restrita ao Workspace
//                        e responde 401 para a Vercel.
//   LEAD_NOTIFICA        e-mail que recebe o aviso de cada lead novo (rede de
//                        segurança: mesmo se a planilha falhar, o lead chega
//                        na caixa de entrada). Padrão: o próprio SMTP_USER.
//
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

  var resultado = { ok: true, planilha: false, email: false, aviso: false };

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

  // ------------------------------------------------- aviso interno (rede de segurança)
  // Sai sempre, mas é o que garante o lead quando a planilha está fora:
  // a inscrição chega na caixa de entrada e dá para recuperar na mão.
  try {
    await avisarEquipe(lead, resultado.planilha);
    resultado.aviso = true;
  } catch (erro) {
    console.error('[lead] falha ao avisar a equipe:', erro);
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

function transportador() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function avisarEquipe(lead, foiParaPlanilha) {
  var destino = process.env.LEAD_NOTIFICA || process.env.SMTP_USER;
  if (!process.env.SMTP_HOST || !destino) return;

  var campos = [
    ['Nome', lead.nome],
    ['E-mail', lead.email],
    ['WhatsApp', lead.whatsapp],
    ['Cidade', lead.cidade],
    ['Porta escolhida', lead.frente],
    ['Aceite de comunicação', lead.aceite_comunicacao ? 'sim' : 'não'],
    ['Origem', lead.origem],
    ['Enviado em', formatarDataHora(lead.enviado_em)]
  ];

  var linhas = campos.map(function (c) {
    return '<tr><td style="padding:3px 14px 3px 0;color:#806453;white-space:nowrap;">' + c[0] +
           '</td><td style="padding:3px 0;color:#1F221A;"><b>' + escapar(c[1] || '—') + '</b></td></tr>';
  }).join('');

  await transportador().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destino,
    replyTo: lead.email,
    subject: 'Novo lead · ' + (lead.nome || 'sem nome') + (foiParaPlanilha ? '' : ' (NÃO foi para a planilha)'),
    html:
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;">' +
      (foiParaPlanilha
        ? '<p style="margin:0 0 12px;color:#806453;">Já gravado na planilha.</p>'
        : '<p style="margin:0 0 12px;padding:8px 10px;background:#F6E9E2;color:#7B3620;"><b>Atenção:</b> a gravação na planilha falhou. Este e-mail é a única cópia deste lead — registre à mão.</p>') +
      '<table cellpadding="0" cellspacing="0">' + linhas + '</table></div>'
  });
}

function formatarDataHora(iso) {
  var d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return String(iso || '');
  var partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).formatToParts(d).reduce(function (acc, p) { acc[p.type] = p.value; return acc; }, {});
  return partes.day + '/' + partes.month + '/' + partes.year + ' ' + partes.hour + ':' + partes.minute;
}

function escapar(v) {
  return String(v).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

async function enviarEmailConfirmacao(lead) {
  if (!process.env.SMTP_HOST) throw new Error('SMTP_HOST não configurado.');

  var primeiroNome = (lead.nome || '').trim().split(/\s+/)[0] || '';

  var pastaEmail = path.join(process.cwd(), 'assets', 'email');
  var html = fs.readFileSync(path.join(pastaEmail, 'convocacao-recebida.html'), 'utf8');

  html = html
    .split('{{PRIMEIRO_NOME}}').join(primeiroNome)
    .split('{{LINK_COLECAO}}').join(process.env.LINK_COLECAO || LINK_COLECAO_PADRAO)
    .split('{{LINK_COMUNIDADE}}').join(process.env.LINK_COMUNIDADE || '#')
    .split('{{LINK_DESCADASTRO}}').join(process.env.LINK_DESCADASTRO || '#');

  await transportador().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: lead.email,
    subject: 'Sua vaga na Convocação pelo Resgate da Família está confirmada',
    html: html,
    // imagens embutidas como anexo inline (cid:) — funcionam em qualquer
    // caixa de entrada, sem depender de um domínio publicado nem de o
    // destinatário clicar em "exibir imagens".
    attachments: ['hero.jpg', 'foto-camisa.jpg', 'foto-comunidade.jpg', 'logo-th.png']
      .map(function (arquivo) {
        return {
          filename: arquivo,
          path: path.join(pastaEmail, 'img', arquivo),
          cid: arquivo.replace(/\.(jpg|png)$/, '')   // cid:hero, cid:foto-camisa, ...
        };
      })
  });
}
