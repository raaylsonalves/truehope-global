/**
 * Cole este código dentro da PRÓPRIA planilha de leads:
 * Extensões → Apps Script → cole (substituindo o que já estiver lá) → Salvar.
 *
 * Depois: Implantar → Nova implantação → tipo "App da Web":
 *   - Executar como: Eu (sua conta)
 *   - Quem tem acesso: Qualquer pessoa
 * Implantar → autorize o script com a sua conta Google → copie a URL que
 * termina em /exec. Essa URL é o LEAD_SHEET_WEBHOOK do .env.example.
 *
 * Não precisa de service account, chave nem API do Google Cloud — o script
 * roda com a sua própria permissão de acesso à planilha.
 */
function doPost(e) {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var dados = JSON.parse(e.postData.contents);

  // primeira execução: se a planilha estiver vazia, escreve o cabeçalho
  if (aba.getLastRow() === 0) {
    aba.appendRow([
      'Data/hora', 'Nome', 'WhatsApp', 'E-mail', 'Cidade',
      'Porta escolhida', 'Aceite comunicação', 'Origem'
    ]);
  }

  aba.appendRow([
    dados.enviado_em || new Date().toISOString(),
    dados.nome || '',
    dados.whatsapp || '',
    dados.email || '',
    dados.cidade || '',
    dados.frente || '',
    dados.aceite_comunicacao ? 'sim' : 'não',
    dados.origem || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
