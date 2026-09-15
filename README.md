# TRUEHOPE · Masterclass 08.10.2026 — landing page

Convite editorial da **TRUEHOPE Masterclass**, dentro do VOA 2026 (São Paulo).
Captura leads e encaminha cada pessoa para uma das quatro frentes do movimento.

Site estático: HTML, CSS e um arquivo JS. Sem build, sem dependência de servidor.

```
index.html
lab-lenco.html         comparador de vento do lenço — página de decisão, descartável
assets/
  css/site.css
  js/site.js           ← a configuração fica no topo deste arquivo
  js/lenco-3d.js        o lenço em three.js — módulo isolado, progressive enhancement
  img/                 imagens já otimizadas (webp) + logo/favicon em SVG
references/            material original (não vai para produção)
.agents/skills/        motion-design-skill, usado como referência de movimento
```
---

## 1. O que você precisa preencher antes de publicar

Abra `assets/js/site.js`. As primeiras linhas são:

```js
var TH = window.TH_CONFIG = {
  destinos: {
    inscricao:  '',   // site oficial de inscrição da masterclass
    loja:       '',   // loja da collab Truehope + Marci  (abre em nova aba)
    convocacao: '',   // grupo / convocação de resgate da família
    comunidade: ''    // comunidade Truehope
  },
  novaAba: ['loja'],
  leadEndpoint: '',   // endpoint que recebe o lead (POST JSON)
  esperaRedirect: 1.4 // segundos antes do redirecionamento automático
};
```

**Enquanto um destino ficar vazio**, a página continua funcionando: o formulário
confirma a inscrição, mostra o recado da Angélica e não redireciona. Assim dá
para publicar antes de os links existirem.

### Os quatro botões

O áudio do briefing pede quatro frentes, todas capturando lead. Elas aparecem em
três lugares: nos cards da seção **"Por onde você entra"**, no `select` do
formulário e nos botões "Garantir meu lugar".

| chave        | card                        | para onde vai depois do cadastro |
|--------------|-----------------------------|----------------------------------|
| `inscricao`  | 01 · Garantir meu lugar     | site de inscrição (mesma aba)    |
| `loja`       | 02 · Vestir o manifesto     | loja da collab (**nova aba**)    |
| `convocacao` | 03 · Assinar a convocação   | grupo / convocação (mesma aba)   |
| `comunidade` | 04 · Fazer parte da comunidade | comunidade (mesma aba)        |

Clicar num card rola até o formulário **já com a porta escolhida**. O lead é
gravado antes do redirecionamento, então nenhuma frente perde o contato.

### O que chega no `leadEndpoint`

`POST` com `Content-Type: application/json`:

```json
{
  "nome": "Maria Silva",
  "whatsapp": "(11) 98765-4321",
  "email": "maria@exemplo.com",
  "cidade": "Fortaleza",
  "frente": "comunidade",
  "aceite_comunicacao": true,
  "evento": "truehope-masterclass-2026-10-08",
  "origem": "https://…",
  "enviado_em": "2026-09-09T11:58:46.251Z"
}
```

Serve qualquer coisa que aceite JSON: uma Function da Netlify, um webhook do
Zapier/Make, uma tabela do Supabase, uma planilha via Apps Script.

Se o envio falhar, o lead é guardado em `localStorage` na chave
`th_leads_pendentes` e a pessoa segue para o destino normalmente — nada trava
por causa de um endpoint fora do ar.

---

## 2. Rodar localmente

```bash
python -m http.server 4321
```

Depois abra `http://localhost:4321`. Precisa ser por HTTP: abrir o arquivo
direto (`file://`) quebra o carregamento das fontes.

---

## 3. Publicar

É estático — sobe em qualquer lugar (Netlify, Vercel, Cloudflare Pages, S3).
Basta enviar `index.html` e a pasta `assets/`. A pasta `references/` é material
de trabalho e **não precisa ir**.

---

## 4. Sistema visual

Cores amostradas direto do brandbook (`references/Apresentação - TrueHope.pdf`):

| token      | hex       | CMYK do brandbook |
|------------|-----------|-------------------|
| `--tinta`  | `#1F221A` | 9, 0, 26, 86      |
| `--oliva`  | `#464A33` | 7, 0, 32, 71      |
| `--vinho`  | `#4F1C0A` | 0, 65, 86, 69     |
| `--terra`  | `#7B3620` | 0, 56, 73, 51     |
| `--taupe`  | `#806453` | 0, 21, 34, 50     |
| `--creme`  | `#EBE0D1` | 0, 4, 11, 8       |

`--papel` e `--papel-2` são derivações mais claras do creme, para dar respiro às
seções longas.

**Tipografia.** Satoshi é a fonte da marca (via Fontshare). Para o display usei
**Bodoni Moda**, que é a didone mais próxima da usada nas peças do convite, e
**Cormorant Garamond** itálico para as falas — o mesmo papel que o itálico tem
nos posts ("*A porta da vida*"). As fontes originais das peças impressas
(Loverica, Golden Hopes) são demo/uso pessoal e não podem ir para a web.

**Logo.** O monograma é redesenhado em SVG (`assets/img/logo-truehope.svg`), com
as proporções medidas a partir do arquivo original — quatro retângulos: travessa,
haste do Chet, haste do He e a trave que fecha o portal. É essa separação que
permite animar a construção da marca no preloader.

**A assinatura.** A linha de fecho do hero ("*ainda edifica.*") usa **Dancing
Script 600** — a caligrafia monolinha e conectada que já aparece nos adesivos de
piso e no restante das peças impressas do evento (`references/Adesivos Piso*.png`).

---

## 5. Movimento

GSAP 3.13 (ScrollTrigger + SplitText) e Lenis para a rolagem suave, ambos por CDN.

| momento         | o que acontece |
|-----------------|----------------|
| Preloader       | o monograma se constrói na ordem da história da marca (haste → travessa → segunda haste → trave), e cinco cortinas abrem |
| Hero            | o pátio de arcos ao fundo, em paralaxe contida; a próxima seção sobe cobrindo a foto de baixo para cima conforme você rola |
| Convite         | paralaxe na foto sticky |
| Manifesto       | revelação linha a linha, com máscara |
| O símbolo       | cinco painéis full-bleed em scroll lateral — a foto ocupa a seção inteira e um painel colorido cobre a imagem da direita para a esquerda, como uma cortina, revelando a descrição |
| A coleção       | trilho horizontal com sete peças, todas na mesma proporção, e paralaxe dentro de cada moldura |
| O lenço         | plano em three.js, ondulando por conta própria e reagindo ao mouse/toque como um pano de verdade |

### O hero — foto de fundo e contraste

O fundo é `hero-arcos.webp` (35 KB — a imagem comprime muito bem porque é quase
toda gradiente suave). Sobre ela vai um **véu de papel**: gradientes translúcidos
na cor `--papel` que sustentam a legibilidade sem lavar a arquitetura.

O texto muda de lado entre desktop (direita) e mobile (esquerda), então o véu
muda junto — e o enquadramento também: em telas estreitas o `object-fit: cover`
amplia tanto que sobraria só parede lisa, então `object-position` vai para
`78% 42%` e traz a passagem em arco de volta.

Contraste medido pixel a pixel sobre a foto renderizada (pior caso, 0,5% dos
pixels mais escuros da área de cada texto):

| | título | data/local | rótulo |
|---|---|---|---|
| 1440px | 5,8:1 | 6,9:1 | 5,8:1 |
| 768px  | 6,2:1 | 6,8:1 | 5,4:1 |
| 390px  | 7,5:1 | 7,5:1 | 4,9:1 |
| 360px  | 7,4:1 | 7,5:1 | 4,9:1 |

Foi por essa medição que a linha de data/local passou de `--tinta-suave` para
`--tinta` (estava em 2,8:1) e o rótulo de cima passou de `--terra` para
`--vinho` (estava em 3,6:1 nas sombras da folhagem). Se você trocar a foto do
hero, vale refazer essa conta.

**A cobertura.** O antigo efeito de "atravessar um portal" saiu. Agora o hero é
uma foto pinada (`position:sticky`) e a **seção seguinte** (o convite) sobe por
cima dela conforme você rola — é o próprio CSS sticky fazendo o trabalho, sem
JS: o convite é só a próxima seção no fluxo normal do documento, com fundo
opaco. O JS só cuida do texto do hero (some um pouco antes de ser coberto, para
não ficar "espremido" na costura) e de uma sombra suave no topo do convite
(`.convite::before`), que vende a sensação de uma folha se levantando.

### O símbolo — full-bleed com cortina colorida

Cada painel agora é a peça de social **inteira**, ocupando a seção toda
(`position:absolute;inset:0` na foto). Por cima, um painel de texto ancorado à
direita — com cor própria por painel (`data-cor="vinho|oliva|terra|tinta|papel"`
no HTML, mapeado no CSS) — cobre a imagem da direita para a esquerda conforme o
painel entra em cena:

```css
clip-path: inset(0% 0% 0% 100%);   /* nada visível: 100% cortado a partir da esquerda */
clip-path: inset(0% 0% 0% 0%);     /* painel inteiro visível */
```

Ao encolher o corte esquerdo de 100% para 0%, a área visível cresce a partir da
borda direita — uma cortina, não um deslocamento. Cada painel tem sua própria
cor (contraste conferido: creme sobre vinho/oliva/terra/tinta fica acima de
6,7:1; tinta sobre papel, 14:1), sem numeral e sem a dica "role para o lado" —
o gesto já é óbvio com a imagem ocupando a tela inteira.

O `snap` entre painéis **não** usa o `snap` nativo do ScrollTrigger: ele disputa
a posição com o Lenis e catapulta a leitura para o começo ou o fim da fita. O
assentamento é feito pedindo ao próprio Lenis para rolar (`lenis.scrollTo`),
150 ms depois que a rolagem para — um só dono da rolagem, sem cabo de guerra.

### O lenço — three.js com hover, e um fallback que nunca falta

O lenço é um `PlaneGeometry` (44×44 segmentos) com a arte como textura, em
`assets/js/lenco-3d.js` — módulo isolado, carregado como *progressive
enhancement*: `site.js` só chama `TH_iniciarLenco3D()` quando confirma WebGL,
`THREE` carregado e `prefers-reduced-motion` desligado.

- **Ondulação ambiente**: duas senoides de baixa amplitude, sempre ativas —
  como uma bandeira sob brisa leve (0,03 de deslocamento em Z, plano de lado 2).
- **Toque/hover**: cada `pointermove` empilha uma "estampa" `{x, y, t0, força}`;
  no quadro seguinte, cada estampa irradia um anel que decai no tempo e na
  distância (`exp(-idade×1.35) × exp(-distância×1.05)`) — arrastar o mouse
  rápido cria uma sequência de anéis, uma corrida de ondulações reais.
- **Luz rasante**: a `DirectionalLight` principal fica quase de raspão pela
  superfície (não frontal) — é isso que faz uma dobra pequena projetar sombra
  visível. Testado numericamente: uma estampa leva o deslocamento máximo de
  ~0,025 (ambiente) para ~0,51, decaindo para ~0,07 em 1,6 s.
- **Custo controlado**: `IntersectionObserver` pausa o loop de render quando a
  seção sai da tela; `devicePixelRatio` limitado a 2×.

**O fallback nunca é um buraco.** O tecido plano com o filtro de vento em SVG
(o mesmo de antes, comparável em `lab-lenco.html`) é sempre inicializado
primeiro — é barato (CSS + SVG). O three.js só entra por cima e esconde o
fallback via `.lenco--3d`, e só depois que a textura confirma ter carregado
(`onPronto`). Se o WebGL não existe, o CDN do three.js está fora do ar, ou a
textura falha ao carregar, o fallback continua exatamente onde estava — nunca
há um instante em que nada aparece. Os quatro cenários (sucesso, sem WebGL,
CDN bloqueado, movimento reduzido) têm teste automatizado dedicado.

Mesmo no fallback, passar o mouse ainda responde — um `scale` sutil via CSS
(`.lenco__cena:hover .lenco__sopro`) — para a dica "toque ou passe o mouse"
continuar verdadeira mesmo sem o three.js. Em `prefers-reduced-motion`, a dica
e o próprio hover somem, seguindo o mesmo padrão do `hero__cue` e do
`trilho__dica`.

**Ajustar a intensidade do fallback.** Abra `lab-lenco.html`
(`http://localhost:4321/lab-lenco.html`): compara *brisa*, *vento* e *seda*
lado a lado. Hoje o fallback usa **brisa**; para trocar, mude
`data-vento="vento"` na `<section id="lenco">` ou chame `TH_VENTO('seda')` no
console (as três intensidades ficam em `VENTO`, no `site.js`). **O
`lab-lenco.html` é uma página de decisão — pode apagar antes de publicar.**

### Três coisas que o código protege de propósito

1. **Acentos.** A máscara de revelação tem `padding-top: .22em` (`mascarar()` em
   `site.js`). Sem essa folga, a máscara tem exatamente a altura da linha e
   decepa o Í de FAMÍLIA, o Ã de NÃO e o Ç de CONVICÇÃO.
2. **Medida de texto.** As larguras do display são em `em` da própria frase, não
   em `ch` do bloco — `ch` resolveria contra a Satoshi de 16px e espremeria os
   títulos em colunas estreitas demais.
3. **Se o movimento cair, a página continua.** Testado em cinco cenários:
   `prefers-reduced-motion`, CDN do GSAP fora do ar, JavaScript desligado, sem
   WebGL e com o CDN do three.js bloqueado. Em todos, o conteúdo aparece
   inteiro, o preloader sai da frente, a rolagem fica livre, o trilho
   horizontal vira uma grade que embrulha e o lenço volta ao tecido plano. Se
   o `site.js` não assumir em 5 segundos, uma rede de segurança no `<head>`
   devolve a página ao estado estático.

---

## 6. Conteúdo — de onde veio cada informação

Tudo vem de `references/`:

- **Datas, endereço, programação e vozes** — `Convite Truehope Experiência.pdf` e
  `Marci - Briefing Masterclass.pdf`.
- **Manifesto** — texto fornecido no briefing.
- **Paleta, fontes e logo** — `Apresentação - TrueHope.pdf`.
- **Fotos da coleção** — os dois JPEGs originais (4000×6000) e a arte do lenço,
  recortados e otimizados para web (`assets/img/`).
- **Painéis do símbolo** (`sim-01` a `sim-05`) — as cinco peças de social já
  prontas, normalizadas em 4:5 e na ordem do argumento: olhe de novo → duas
  letras → juntas, um portal → o portal da promessa → a sua casa.

### Dois pontos que valem sua conferência

- **O número do público.** O áudio fala em *7.500 pessoas em São Paulo* para o
  evento maior (VOA), com a masterclass acontecendo dentro dele. Já a LP anterior
  e as artes falam em *300 lugares / trezentas mulheres* para a masterclass. Na
  página escrevi o VOA como "um encontro de sete mil e quinhentas pessoas" e
  **não afirmei** um número de vagas da masterclass — se as 300 vagas estiverem
  confirmadas, dá para reforçar a escassez ("Trezentos lugares. Depois disso,
  fecha."), que era um bom gancho da versão anterior.
- **O embargo das 15h** está na página, como pede o briefing da Marci.

---

## 7. O formulário — para onde vai o lead

O site continua estático (sem build), mas o formulário agora tem para onde
enviar: `TH_CONFIG.leadEndpoint` (em `assets/js/site.js`) aponta para
`/api/lead`, uma função serverless em `api/lead.js` (Node, deploy na Vercel).
A cada envio ela:

1. grava a linha (nome, WhatsApp, e-mail, cidade, porta escolhida, aceite de
   comunicação, origem) numa planilha do Google, via um Apps Script publicado
   como Web App (`apps-script/gravar-lead.gs`) — sem service account, sem
   chave, sem depender de política de organização do Google Cloud;
2. dispara o e-mail de confirmação — `assets/email/convocacao-recebida.html` —
   pelo SMTP do próprio domínio TRUEHOPE, com nodemailer.

Se a planilha ou o SMTP falharem, o formulário mesmo assim confirma na tela
(o lead não pode se perder por causa de uma integração fora do ar) — o erro
só fica registrado no log da função.

**Para publicar:**

1. Importe o repositório na Vercel (ele detecta `api/lead.js` sozinho, não
   precisa de build).
2. Preencha as variáveis de `.env.example` em Project Settings → Environment
   Variables — nunca comitar esse arquivo com valores reais.
3. Para a planilha: abra `apps-script/gravar-lead.gs`, copie o código para
   dentro da planilha de leads (Extensões → Apps Script), implante como
   "App da Web" (executar como você, acesso "qualquer pessoa") e cole a URL
   `/exec` em `LEAD_SHEET_WEBHOOK`.
4. Para o SMTP: use as credenciais do provedor de e-mail do domínio
   `truehope.com.br` (host, porta, usuário, senha).

