/* ==========================================================================
   TRUEHOPE — Masterclass 08.10.2026
   GSAP 3.13 (ScrollTrigger + SplitText) · Lenis
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     CONFIGURAÇÃO — preencha os quatro destinos e o endpoint de leads.
     Enquanto um destino ficar vazio, o formulário apenas confirma o cadastro
     (sem redirecionar) e o botão de continuar não aparece.
     ------------------------------------------------------------------------ */
  var TH = window.TH_CONFIG = {
    destinos: {
      inscricao:  'https://www.e-inscricao.com/global-awakening-brazil/truehope',   // inscrição oficial da masterclass (abre em nova aba)
      loja:       'https://www.marcioficial.com.br/',   // loja da collab Truehope + Marci  (abre em nova aba)
      convocacao: '',   // grupo / convocação de resgate da família
      comunidade: 'https://chat.whatsapp.com/BLclvT8iGUS2nqq93Kbe3e'   // comunidade Truehope no WhatsApp
    },
    // Abas novas: destinos que NÃO devem substituir esta página.
    novaAba: ['loja', 'comunidade', 'inscricao'],
    // Endpoint que recebe o lead (POST JSON). Vazio = nada é enviado.
    // /api/lead é a função serverless da Vercel (api/lead.js) que grava
    // o lead na planilha e dispara o e-mail de confirmação pelo SMTP.
    leadEndpoint: '/api/lead',
    // Segundos antes do redirecionamento automático.
    esperaRedirect: 1.4
  };

  var rotulos = {
    inscricao:  'Ir para a inscrição',
    loja:       'Ver a coleção',
    convocacao: 'Entrar no grupo',
    comunidade: 'Entrar na comunidade'
  };

  var $  = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temGsap = typeof window.gsap !== 'undefined';

  /* ------------------------------------------------------------------------
     Máscara de linha com folga para acentos.

     A máscara padrão tem exatamente a altura da caixa de linha, o que decepa
     Í, Ã e Ç nas caixas altas da Bodoni — inaceitável em português. O padding
     superior aumenta só o corte de cima; a linha entra sempre por baixo, então
     nada indesejado aparece na folga.
     ------------------------------------------------------------------------ */
  function mascarar(linhas) {
    return linhas.map(function (linha) {
      var mascara = document.createElement('span');
      mascara.className = 'ln-mask';
      mascara.style.display = 'block';
      mascara.style.overflow = 'hidden';
      mascara.style.paddingTop = '.22em';
      mascara.style.marginTop = '-.22em';
      linha.parentNode.insertBefore(mascara, linha);
      mascara.appendChild(linha);
      linha.style.display = 'block';
      return linha;
    });
  }

  // Divide um elemento em linhas (SplitText quando disponível) e as mascara.
  function linhasMascaradas(el) {
    var linhas = null;
    if (typeof window.SplitText !== 'undefined') {
      try {
        linhas = new SplitText(el, { type: 'lines', linesClass: 'ln' }).lines;
      } catch (e) { linhas = null; }
    }
    if (!linhas || !linhas.length) return null;
    return mascarar(linhas);
  }

  /* ======================================================================
     1. SCROLL SUAVE (Lenis) + ScrollTrigger
     ====================================================================== */
  var lenis = null;

  function iniciarScroll() {
    if (!temGsap) return;
    gsap.registerPlugin(ScrollTrigger);

    if (reduz || typeof window.Lenis === 'undefined') return;

    lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ======================================================================
     2. PRELOADER — o monograma se constrói, depois as cortinas abrem
     ====================================================================== */
  function preloader(aoTerminar) {
    var pre = $('#preloader');
    var cortina = $('.pre-cortina');
    if (!pre) { aoTerminar(); return; }

    if (reduz || !temGsap) {
      pre.hidden = true;
      if (cortina) cortina.hidden = true;
      document.body.classList.remove('travado');
      aoTerminar();
      return;
    }

    document.body.classList.add('travado');
    if (lenis) lenis.stop();

    var mono = $('.pre-mono', pre);
    var letras = $$('.pre-nome span', pre);
    var barra = $('.pre-barra i', pre);

    gsap.set($('.m-travessa', mono), { scaleX: 0, transformOrigin: 'center center' });
    gsap.set($('.m-chet', mono),     { scaleY: 0, transformOrigin: 'center top' });
    gsap.set($('.m-he', mono),       { scaleY: 0, transformOrigin: 'center bottom' });
    gsap.set($('.m-trave', mono),    { scaleX: 0, transformOrigin: 'left center' });
    gsap.set(letras, { yPercent: 120, opacity: 0 });

    // A construção: haste, travessa, segunda haste, e por fim a trave que
    // fecha o portal — a mesma ordem em que a marca conta a própria história.
    var montar = gsap.timeline();
    montar
      .to($('.m-chet', mono),     { scaleY: 1, duration: .85, ease: 'expo.out' })
      .to($('.m-travessa', mono), { scaleX: 1, duration: .70, ease: 'expo.out' }, '-=.55')
      .to($('.m-he', mono),       { scaleY: 1, duration: .70, ease: 'expo.out' }, '-=.42')
      .to($('.m-trave', mono),    { scaleX: 1, duration: .45, ease: 'power2.out' }, '-=.24')
      .to(letras, { yPercent: 0, opacity: 1, duration: .70, ease: 'expo.out', stagger: .035 }, '-=.30')
      .to(barra,  { scaleX: 1, duration: 1.15, ease: 'power1.inOut' }, '-=.65');

    // Sai quando a página terminar de carregar — nunca antes de 1,9s,
    // nunca depois de 4,5s.
    var pronto = new Promise(function (res) {
      if (document.readyState === 'complete') res();
      else window.addEventListener('load', res, { once: true });
    });
    var minimo = new Promise(function (res) { setTimeout(res, 1900); });
    var teto = new Promise(function (res) { setTimeout(res, 4500); });

    Promise.race([Promise.all([pronto, minimo]), teto]).then(sair);

    var saiu = false;
    function sair() {
      if (saiu) return;
      saiu = true;

      gsap.timeline({
        onComplete: function () {
          pre.hidden = true;
          if (cortina) cortina.hidden = true;
          document.body.classList.remove('travado');
          if (lenis) lenis.start();
          ScrollTrigger.refresh();
          aoTerminar();
        }
      })
        .to(barra, { scaleX: 1, duration: .3, ease: 'power2.out' }, 0)
        .to('.pre-marca', { y: -18, opacity: 0, duration: .55, ease: 'power2.in' }, '>-.05')
        .set(pre, { autoAlpha: 0 })
        .to('.pre-cortina i', {
          scaleY: 0,
          transformOrigin: 'center top',
          duration: .95,
          ease: 'expo.inOut',
          stagger: { each: .055, from: 'start' }
        }, '<');
    }
  }

  /* ======================================================================
     3. HERO — o leitor atravessa o portal
     ====================================================================== */
  function hero() {
    var sec = $('#hero');
    if (!sec || !temGsap) return;

    // entrada
    if (!reduz) {
      // As linhas do título já vêm quebradas no HTML: só mascarar.
      var linhas = mascarar($$('.hero__titulo .ln'));
      gsap.set(linhas, { yPercent: 108 });

      gsap.timeline({ delay: .1 })
        .to(linhas, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: .075 })
        .from('[data-hero="3"]', { opacity: 0, y: 14, duration: .9, ease: 'power2.out' }, '-=.55')
        .from('.hero__fundo img', { scale: 1.09, duration: 2.2, ease: 'expo.out' }, 0);
    }

    if (reduz) return;

    // A foto fica pinada (sticky, no CSS) e a PRÓXIMA seção sobe por cima
    // dela, cobrindo-a de baixo para cima — sem arco, sem fade artificial: o
    // que fecha a cena é o próprio convite chegando. O texto some rápido e só
    // no fim, para não ficar "espremido" bem na costura entre as seções.
    gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: .6 }
    })
      .to('.hero__fundo img', { yPercent: 6, scale: 1.04, ease: 'none', duration: 1 }, 0)
      .to('.hero__conteudo',  { opacity: 0, y: -22, ease: 'power1.in', duration: .3 }, .68);
  }

  /* ------------------------------------------------------------------------
     Botões que apontam direto para fora (loja, comunidade): em vez de passar
     pelo formulário, [data-link] resolve para TH.destinos na hora — o href
     estático (#mesa) no HTML é só um fallback caso o destino ainda esteja
     vazio, e continua levando ao formulário normalmente.
     ------------------------------------------------------------------------ */
  function linksDiretos() {
    $$('[data-link]').forEach(function (el) {
      var chave = el.getAttribute('data-link');
      var destino = TH.destinos[chave];
      if (!destino) return;
      el.href = destino;
      if (TH.novaAba.indexOf(chave) !== -1) {
        el.target = '_blank';
        el.rel = 'noopener';
      }
    });
  }

  /* ======================================================================
     4. NAV
     ====================================================================== */
  function nav() {
    var el = $('#nav');
    if (!el) return;

    // Links do menu (linha e sanduíche): rolagem suave via Lenis (com
    // fallback nativo) — o scrollIntoView normal já funciona sem JS, isso
    // só deixa mais macio. Clicar num link do painel mobile também fecha
    // o painel.
    // O painel mobile (#navDrawer) foi colocado fora do #nav de propósito
    // (ver comentário no HTML) — por isso os links dele são pegos à parte.
    var burger = $('#navBurger'), drawer = $('#navDrawer');
    $$('.nav__menu a, .nav__marca', el).concat($$('.nav__drawer a', drawer)).forEach(function (a) {
      a.addEventListener('click', function (ev) {
        fecharPainel();
        var alvo = $(a.getAttribute('href'));
        if (!alvo) return;
        ev.preventDefault();
        if (lenis) lenis.scrollTo(alvo, { offset: -20, duration: 1.1 });
        else alvo.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth' });
      });
    });

    // Sanduíche: abre/fecha o painel com os mesmos links, para telas onde
    // o menu em linha não cabe. Como o painel é `position:fixed` e vive
    // fora da pílula (pra não inflar a largura `max-content` dela), a
    // posição (right/top) é calculada aqui, a partir do retângulo real da
    // pílula, sempre que ele abre.
    function posicionarPainel() {
      var r = el.getBoundingClientRect();
      drawer.style.top = Math.round(r.bottom + 10) + 'px';
      drawer.style.right = Math.round(window.innerWidth - r.right) + 'px';
    }
    function fecharPainel() {
      if (!burger || !drawer) return;
      burger.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('aberto');
    }
    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var abrir = burger.getAttribute('aria-expanded') !== 'true';
        if (abrir) posicionarPainel();
        burger.setAttribute('aria-expanded', abrir ? 'true' : 'false');
        drawer.classList.toggle('aberto', abrir);
      });
      document.addEventListener('click', function (ev) {
        if (!el.contains(ev.target) && !drawer.contains(ev.target)) fecharPainel();
      });
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') fecharPainel();
      });
      window.addEventListener('resize', fecharPainel);
    }

    if (!temGsap) return;
    // O CSS esconde a pílula com translateY(-130%) para não piscar antes do
    // JS. O GSAP leria essa matriz como pixels, então o estado inicial é
    // reafirmado aqui em yPercent — senão animar yPercent:0 não move nada.
    gsap.set(el, { yPercent: -130, y: 0 });
    var mostrar = gsap.to(el, { yPercent: 0, duration: .45, ease: 'power3.out', paused: true });

    // Some ao rolar pra baixo, volta ao rolar pra cima — em qualquer ponto
    // da página, não só na saída do hero. Perto do topo ela fica sempre
    // escondida (a área já é limpa por natureza, sem precisar de nav).
    var visivel = false;
    var limiar = 120;
    function mostra() { if (!visivel) { visivel = true; mostrar.play(); } }
    function esconde() { if (visivel) { visivel = false; mostrar.reverse(); fecharPainel(); } }

    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        if (self.scroll() < limiar) { esconde(); return; }
        if (self.direction === -1) mostra(); else esconde();
      }
    });

    // Encostar o mouse ali no topo também traz a barra de volta — um
    // atalho pra quem não quer rolar pra cima só para acessar o menu.
    document.addEventListener('mousemove', function (ev) {
      if (ev.clientY < 64 && window.scrollY > limiar) mostra();
    });
  }

  /* ======================================================================
     5. REVELAÇÕES — blocos e linhas de texto
     ====================================================================== */
  function reveals() {
    if (!temGsap) return;

    if (reduz) {
      gsap.set('.rv', { opacity: 1 });
      return;
    }

    ScrollTrigger.batch('.rv', {
      start: 'top 88%',
      once: true,
      onEnter: function (alvos) {
        gsap.fromTo(alvos,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .07, overwrite: true });
      }
    });

    // Frases do manifesto: revelação linha a linha, com máscara.
    $$('[data-linhas]').forEach(function (el) {
      var linhas = linhasMascaradas(el);
      if (!linhas || !linhas.length) {
        gsap.fromTo(el, { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 1, ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
        return;
      }
      gsap.from(linhas, {
        yPercent: 112,
        duration: 1.15,
        ease: 'expo.out',
        stagger: .09,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true }
      });
    });
  }

  /* ======================================================================
     6. PARALAXE nas imagens emolduradas
     ====================================================================== */
  function paralaxe() {
    if (!temGsap || reduz) return;
    // As peças do trilho recebem paralaxe horizontal em trilho(), não aqui.
    $$('[data-parallax]:not(.peca__moldura)').forEach(function (moldura) {
      var img = moldura.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: moldura,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  /* ======================================================================
     7. O SÍMBOLO — painéis em scroll lateral
     ====================================================================== */
  function simbolo() {
    var sec = $('#simbolo');
    var fita = $('#simFita');
    if (!sec || !fita || !temGsap || reduz) return;

    sec.classList.add('horiz');

    var quadros = $$('.quadro', fita);
    var n = quadros.length;
    var paradas = Math.max(1, n - 1); // transições = slides - 1

    // Cada transição consome uma tela de rolagem. Não é medida em DOM —
    // os slides ficam todos no mesmo lugar (position:absolute), então a
    // distância é só "quantas telas" o gesto de cobrir precisa.
    var porTransicao = function () { return window.innerHeight; };
    var distanciaTotal = function () { return paradas * porTransicao(); };

    // Slide 0 já começa visível; os demais começam fora, à direita,
    // esperando a vez de cobrir o slide anterior.
    gsap.set(quadros[0], { xPercent: 0 });
    for (var i = 1; i < n; i++) gsap.set(quadros[i], { xPercent: 100 });

    /* Assentar em cada slide.

       O `snap` nativo do ScrollTrigger disputa a posição com o Lenis e acaba
       catapultando a leitura para o começo ou para o fim da sequência. O
       assentamento é feito aqui, pedindo ao próprio Lenis para rolar — um só
       dono da rolagem, sem cabo de guerra. */
    var descanso;
    function assentar(self) {
      clearTimeout(descanso);
      if (!self.isActive) return;
      descanso = setTimeout(function () {
        if (!self.isActive) return;
        var p = self.progress;
        var alvo = Math.round(p * paradas) / paradas;
        if (Math.abs(alvo - p) < .004) return;
        var y = self.start + (self.end - self.start) * alvo;
        if (lenis) lenis.scrollTo(y, { duration: .55 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
      }, 150);
    }

    // Uma timeline mestra, com "paradas" segmentos de 1 unidade cada — e
    // ela precisa estar COMPLETA (todos os filhos já dentro) antes de
    // ganhar o ScrollTrigger: passar `scrollTrigger` no construtor e só
    // depois empilhar `.to()` faz o GSAP fixar a escala do scrub com a
    // timeline ainda vazia, e o progresso da rolagem para de bater com o
    // tempo real dela. Por isso o `ScrollTrigger.create` vem depois de
    // montada — é o mesmo mecanismo do hero cobrindo a seção anterior, só
    // que aqui se repete N-1 vezes em sequência.
    var mestre = gsap.timeline({ paused: true });

    for (var s = 1; s < n; s++) {
      var slide = quadros[s];
      var foto = slide.querySelector('.quadro__foto img');
      var pos = s - 1; // posição desse slide na timeline mestra

      mestre.to(slide, { xPercent: 0, ease: 'none', duration: 1 }, pos);
      if (foto) {
        mestre.fromTo(foto, { scale: 1.08 }, { scale: 1, ease: 'none', duration: 1 }, pos);
      }
    }

    ScrollTrigger.create({
      animation: mestre,
      trigger: sec,
      start: 'top top',
      end: function () { return '+=' + distanciaTotal(); },
      scrub: .6,
      pin: sec.querySelector('.simbolo__palco'),
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: assentar
    });

    gsap.to('#simProg', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: sec, start: 'top top',
        end: function () { return '+=' + distanciaTotal(); },
        scrub: .3, invalidateOnRefresh: true
      }
    });
  }

  /* ======================================================================
     8. A COLEÇÃO — trilho horizontal
     ====================================================================== */
  function trilho() {
    var sec = $('#trilho');
    var fita = $('#fita');
    if (!sec || !fita || !temGsap || reduz) return;

    // Medida imune ao transform: offsetLeft/offsetWidth são posições de layout.
    var distancia = function () {
      var ultima = fita.lastElementChild;
      if (!ultima) return 0;
      var folga = parseFloat(getComputedStyle(fita).paddingRight) || 0;
      var largura = ultima.offsetLeft + ultima.offsetWidth + folga;
      return Math.max(0, largura - window.innerWidth);
    };

    sec.classList.add('horiz');

    // Fixar via ScrollTrigger (e não com `position:sticky` mais altura manual):
    // com sticky sobrava uma tela inteira de rolagem morta depois que a fita
    // chegava ao fim, com as peças escorrendo para fora do topo.
    var animacao = gsap.to(fita, {
      x: function () { return -distancia(); },
      ease: 'none',
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: function () { return '+=' + distancia(); },
        scrub: .55,
        pin: sec.querySelector('.trilho__palco'),
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    gsap.to('#trilhoProg', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: function () { return '+=' + distancia(); },
        scrub: .3,
        invalidateOnRefresh: true
      }
    });

    // paralaxe dentro das peças, agora amarrada ao movimento horizontal
    $$('.peca__moldura', fita).forEach(function (moldura) {
      var img = moldura.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5,
        ease: 'none',
        scrollTrigger: {
          trigger: moldura,
          containerAnimation: animacao,
          start: 'left right',
          end: 'right left',
          scrub: true
        }
      });
    });
  }

  /* ======================================================================
     10. AS QUATRO PORTAS + FORMULÁRIO
     ====================================================================== */
  function formulario() {
    var form = $('#form');
    if (!form) return;

    var select = $('#frente');
    var ok = $('#ok'), okTexto = $('#okTexto'), okNota = $('#okNota'), okLink = $('#okLink');

    /* --- atalhos: qualquer botão "data-ir-mesa" leva à mesa já com a porta escolhida */
    $$('[data-ir-mesa]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var frente = btn.getAttribute('data-frente');
        if (frente && select) {
          select.value = frente;
          limparErro(select.closest('.campo'));
        }
        irPara('#mesa', function () {
          var vazio = $$('#form input[required]').filter(function (i) { return !i.value.trim(); })[0];
          if (vazio) vazio.focus({ preventScroll: true });
        });
      });
    });

    function irPara(hash, depois) {
      var alvo = $(hash);
      if (!alvo) return;
      if (lenis) {
        lenis.scrollTo(alvo, { offset: -20, duration: 1.1, onComplete: depois });
      } else {
        alvo.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth' });
        setTimeout(depois || function () {}, 700);
      }
    }

    /* --- validação */
    // nome e sobrenome, só letras (com acentos), sem números.
    var RE_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['-][A-Za-zÀ-ÖØ-öø-ÿ]+)*(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['-][A-Za-zÀ-ÖØ-öø-ÿ]+)*)+$/;
    var testes = {
      nome:   function (v) { return RE_NOME.test(v.trim()); },
      // faixa larga de propósito: o DDD de 2 dígitos é só o padrão do Brasil —
      // outros países têm números locais de tamanhos bem diferentes.
      zap:    function (v) { var n = v.replace(/\D/g, '').length; return n >= 6 && n <= 14; },
      mail:   function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      cidade: function (v) { return v.trim().length > 1; },
      frente: function (v) { return !!v; }
    };

    function campoDe(id) { return document.querySelector('[data-campo="' + id + '"]'); }
    function limparErro(c) { if (c) c.classList.remove('invalido'); }

    Object.keys(testes).forEach(function (id) {
      var el = $('#' + id);
      if (!el) return;
      el.addEventListener('input', function () { limparErro(campoDe(id)); });
      el.addEventListener('change', function () { limparErro(campoDe(id)); });
    });

    // nome: impede dígitos enquanto digita (não só na validação final)
    var nomeInput = $('#nome');
    if (nomeInput) {
      nomeInput.addEventListener('input', function () {
        var limpo = nomeInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'\-\s]/g, '');
        if (limpo !== nomeInput.value) nomeInput.value = limpo;
      });
    }

    /* --- DDI: seletor interativo do país de origem --- */
    var ddiAtual = seletorDdi();

    // máscara do WhatsApp: o padrão "(DDD) 90000-0000" só faz sentido para o
    // Brasil — para os demais países mostra só os dígitos, sem forçar um
    // formato de DDD que não existe fora daqui.
    var zap = $('#zap');
    if (zap) {
      zap.addEventListener('input', function () {
        var n = zap.value.replace(/\D/g, '').slice(0, 14);
        var s = n;
        if (ddiAtual.iso === 'BR') {
          n = n.slice(0, 11);
          if (n.length > 2) s = '(' + n.slice(0, 2) + ') ' + n.slice(2);
          if (n.length > 7) {
            var corte = n.length > 10 ? 7 : 6;
            s = '(' + n.slice(0, 2) + ') ' + n.slice(2, corte) + '-' + n.slice(corte);
          }
        }
        zap.value = s;
      });
    }

    /* --- envio */
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var primeiroRuim = null;
      Object.keys(testes).forEach(function (id) {
        var el = $('#' + id);
        if (!el) return;
        var bom = testes[id](el.value);
        var campo = campoDe(id);
        if (campo) campo.classList.toggle('invalido', !bom);
        if (!bom && !primeiroRuim) primeiroRuim = el;
      });
      if (primeiroRuim) { primeiroRuim.focus(); return; }

      var frente = select ? select.value : 'inscricao';
      var lead = {
        nome: $('#nome').value.trim(),
        whatsapp: '+' + ddiAtual.ddi + ' ' + $('#zap').value.replace(/\D/g, ''),
        email: $('#mail').value.trim().toLowerCase(),
        cidade: $('#cidade').value.trim(),
        frente: frente,
        aceite_comunicacao: !!($('#aceite') && $('#aceite').checked),
        evento: 'truehope-masterclass-2026-10-08',
        origem: location.href,
        enviado_em: new Date().toISOString()
      };

      var btn = $('#enviar');
      btn.disabled = true;
      btn.querySelector('span').textContent = 'Enviando…';

      enviarLead(lead).then(function () {
        concluir(frente);
      }).catch(function (erro) {
        console.error('[truehope] falha ao registrar o lead:', erro);
        // O lead fica guardado localmente para não se perder.
        try {
          var fila = JSON.parse(localStorage.getItem('th_leads_pendentes') || '[]');
          fila.push(lead);
          localStorage.setItem('th_leads_pendentes', JSON.stringify(fila));
        } catch (e) {}
        concluir(frente);
      });
    });

    function enviarLead(lead) {
      if (!TH.leadEndpoint) {
        console.info('[truehope] lead capturado (sem endpoint configurado):', lead);
        return Promise.resolve();
      }
      return fetch(TH.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r;
      });
    }

    function concluir(frente) {
      var destino = TH.destinos[frente] || '';
      var novaAba = TH.novaAba.indexOf(frente) !== -1;

      form.style.display = 'none';
      ok.classList.add('on');
      okTexto.textContent = 'Recebemos sua confirmação. Um lugar à mesa é seu.';

      if (!destino) {
        okNota.textContent = 'Em breve receberá um e-mail informativo.';
        okLink.parentNode.style.display = 'none';
      } else {
        okLink.href = destino;
        okLink.target = novaAba ? '_blank' : '_self';
        okLink.querySelector('span').textContent = rotulos[frente] || 'Continuar';

        if (novaAba) {
          okNota.textContent = 'A coleção abre em uma nova aba.';
        } else {
          okNota.textContent = 'Estamos te levando para o próximo passo…';
          setTimeout(function () { location.href = destino; }, TH.esperaRedirect * 1000);
        }
      }

      if (temGsap && !reduz) {
        gsap.from(ok, { opacity: 0, y: 18, duration: .8, ease: 'expo.out' });
      }
      irPara('#mesa');
      if (temGsap) ScrollTrigger.refresh();
    }

    function seletorDdi() {
      // lista completa (~195 países) — Brasil primeiro de propósito, o
      // resto em ordem alfabética pelo nome em português.
      var paises = [
        { iso: 'BR', nome: 'Brasil', ddi: '55' },
        { iso: 'AF', nome: 'Afeganistão', ddi: '93' },
        { iso: 'ZA', nome: 'África do Sul', ddi: '27' },
        { iso: 'AL', nome: 'Albânia', ddi: '355' },
        { iso: 'DE', nome: 'Alemanha', ddi: '49' },
        { iso: 'AD', nome: 'Andorra', ddi: '376' },
        { iso: 'AO', nome: 'Angola', ddi: '244' },
        { iso: 'AI', nome: 'Anguilla', ddi: '1264' },
        { iso: 'AQ', nome: 'Antártida', ddi: '672' },
        { iso: 'AG', nome: 'Antígua e Barbuda', ddi: '1268' },
        { iso: 'SA', nome: 'Arábia Saudita', ddi: '966' },
        { iso: 'AR', nome: 'Argentina', ddi: '54' },
        { iso: 'AM', nome: 'Armênia', ddi: '374' },
        { iso: 'AW', nome: 'Aruba', ddi: '297' },
        { iso: 'AU', nome: 'Austrália', ddi: '61' },
        { iso: 'AT', nome: 'Áustria', ddi: '43' },
        { iso: 'AZ', nome: 'Azerbaijão', ddi: '994' },
        { iso: 'BS', nome: 'Bahamas', ddi: '1242' },
        { iso: 'BH', nome: 'Bahrein', ddi: '973' },
        { iso: 'BD', nome: 'Bangladesh', ddi: '880' },
        { iso: 'BB', nome: 'Barbados', ddi: '1246' },
        { iso: 'BE', nome: 'Bélgica', ddi: '32' },
        { iso: 'BZ', nome: 'Belize', ddi: '501' },
        { iso: 'BJ', nome: 'Benin', ddi: '229' },
        { iso: 'BM', nome: 'Bermudas', ddi: '1441' },
        { iso: 'BY', nome: 'Bielorrússia', ddi: '375' },
        { iso: 'BO', nome: 'Bolívia', ddi: '591' },
        { iso: 'BA', nome: 'Bósnia e Herzegovina', ddi: '387' },
        { iso: 'BW', nome: 'Botsuana', ddi: '267' },
        { iso: 'BN', nome: 'Brunei', ddi: '673' },
        { iso: 'BG', nome: 'Bulgária', ddi: '359' },
        { iso: 'BF', nome: 'Burkina Faso', ddi: '226' },
        { iso: 'BI', nome: 'Burundi', ddi: '257' },
        { iso: 'BT', nome: 'Butão', ddi: '975' },
        { iso: 'CV', nome: 'Cabo Verde', ddi: '238' },
        { iso: 'CM', nome: 'Camarões', ddi: '237' },
        { iso: 'KH', nome: 'Camboja', ddi: '855' },
        { iso: 'CA', nome: 'Canadá', ddi: '1' },
        { iso: 'QA', nome: 'Catar', ddi: '974' },
        { iso: 'KZ', nome: 'Cazaquistão', ddi: '7' },
        { iso: 'TD', nome: 'Chade', ddi: '235' },
        { iso: 'CL', nome: 'Chile', ddi: '56' },
        { iso: 'CN', nome: 'China', ddi: '86' },
        { iso: 'CY', nome: 'Cipro', ddi: '357' },
        { iso: 'VA', nome: 'Cidade do Vaticano', ddi: '39' },
        { iso: 'CO', nome: 'Colômbia', ddi: '57' },
        { iso: 'KM', nome: 'Comores', ddi: '269' },
        { iso: 'CG', nome: 'Congo', ddi: '242' },
        { iso: 'CD', nome: 'Congo (RDC)', ddi: '243' },
        { iso: 'KP', nome: 'Coreia do Norte', ddi: '850' },
        { iso: 'KR', nome: 'Coreia do Sul', ddi: '82' },
        { iso: 'CI', nome: 'Costa do Marfim', ddi: '225' },
        { iso: 'CR', nome: 'Costa Rica', ddi: '506' },
        { iso: 'HR', nome: 'Croácia', ddi: '385' },
        { iso: 'CU', nome: 'Cuba', ddi: '53' },
        { iso: 'CW', nome: 'Curaçao', ddi: '599' },
        { iso: 'DK', nome: 'Dinamarca', ddi: '45' },
        { iso: 'DJ', nome: 'Djibuti', ddi: '253' },
        { iso: 'DM', nome: 'Dominica', ddi: '1767' },
        { iso: 'EG', nome: 'Egito', ddi: '20' },
        { iso: 'SV', nome: 'El Salvador', ddi: '503' },
        { iso: 'AE', nome: 'Emirados Árabes Unidos', ddi: '971' },
        { iso: 'EC', nome: 'Equador', ddi: '593' },
        { iso: 'ER', nome: 'Eritreia', ddi: '291' },
        { iso: 'SK', nome: 'Eslováquia', ddi: '421' },
        { iso: 'SI', nome: 'Eslovênia', ddi: '386' },
        { iso: 'ES', nome: 'Espanha', ddi: '34' },
        { iso: 'US', nome: 'Estados Unidos', ddi: '1' },
        { iso: 'EE', nome: 'Estônia', ddi: '372' },
        { iso: 'ET', nome: 'Etiópia', ddi: '251' },
        { iso: 'FJ', nome: 'Fiji', ddi: '679' },
        { iso: 'PH', nome: 'Filipinas', ddi: '63' },
        { iso: 'FI', nome: 'Finlândia', ddi: '358' },
        { iso: 'FR', nome: 'França', ddi: '33' },
        { iso: 'GA', nome: 'Gabão', ddi: '241' },
        { iso: 'GM', nome: 'Gâmbia', ddi: '220' },
        { iso: 'GH', nome: 'Gana', ddi: '233' },
        { iso: 'GE', nome: 'Geórgia', ddi: '995' },
        { iso: 'GI', nome: 'Gibraltar', ddi: '350' },
        { iso: 'GD', nome: 'Granada', ddi: '1473' },
        { iso: 'GR', nome: 'Grécia', ddi: '30' },
        { iso: 'GL', nome: 'Groenlândia', ddi: '299' },
        { iso: 'GP', nome: 'Guadalupe', ddi: '590' },
        { iso: 'GU', nome: 'Guam', ddi: '1671' },
        { iso: 'GT', nome: 'Guatemala', ddi: '502' },
        { iso: 'GY', nome: 'Guiana', ddi: '592' },
        { iso: 'GF', nome: 'Guiana Francesa', ddi: '594' },
        { iso: 'GN', nome: 'Guiné', ddi: '224' },
        { iso: 'GQ', nome: 'Guiné Equatorial', ddi: '240' },
        { iso: 'GW', nome: 'Guiné-Bissau', ddi: '245' },
        { iso: 'HT', nome: 'Haiti', ddi: '509' },
        { iso: 'HN', nome: 'Honduras', ddi: '504' },
        { iso: 'HK', nome: 'Hong Kong', ddi: '852' },
        { iso: 'HU', nome: 'Hungria', ddi: '36' },
        { iso: 'YE', nome: 'Iêmen', ddi: '967' },
        { iso: 'MH', nome: 'Ilhas Marshall', ddi: '692' },
        { iso: 'SB', nome: 'Ilhas Salomão', ddi: '677' },
        { iso: 'IN', nome: 'Índia', ddi: '91' },
        { iso: 'ID', nome: 'Indonésia', ddi: '62' },
        { iso: 'IR', nome: 'Irã', ddi: '98' },
        { iso: 'IQ', nome: 'Iraque', ddi: '964' },
        { iso: 'IE', nome: 'Irlanda', ddi: '353' },
        { iso: 'IS', nome: 'Islândia', ddi: '354' },
        { iso: 'IL', nome: 'Israel', ddi: '972' },
        { iso: 'IT', nome: 'Itália', ddi: '39' },
        { iso: 'JM', nome: 'Jamaica', ddi: '1876' },
        { iso: 'JP', nome: 'Japão', ddi: '81' },
        { iso: 'JE', nome: 'Jersey', ddi: '44' },
        { iso: 'JO', nome: 'Jordânia', ddi: '962' },
        { iso: 'KI', nome: 'Kiribati', ddi: '686' },
        { iso: 'KW', nome: 'Kuwait', ddi: '965' },
        { iso: 'LA', nome: 'Laos', ddi: '856' },
        { iso: 'LS', nome: 'Lesoto', ddi: '266' },
        { iso: 'LV', nome: 'Letônia', ddi: '371' },
        { iso: 'LB', nome: 'Líbano', ddi: '961' },
        { iso: 'LR', nome: 'Libéria', ddi: '231' },
        { iso: 'LY', nome: 'Líbia', ddi: '218' },
        { iso: 'LI', nome: 'Liechtenstein', ddi: '423' },
        { iso: 'LT', nome: 'Lituânia', ddi: '370' },
        { iso: 'LU', nome: 'Luxemburgo', ddi: '352' },
        { iso: 'MO', nome: 'Macau', ddi: '853' },
        { iso: 'MK', nome: 'Macedônia do Norte', ddi: '389' },
        { iso: 'MG', nome: 'Madagascar', ddi: '261' },
        { iso: 'MY', nome: 'Malásia', ddi: '60' },
        { iso: 'MW', nome: 'Malaui', ddi: '265' },
        { iso: 'MV', nome: 'Maldivas', ddi: '960' },
        { iso: 'ML', nome: 'Mali', ddi: '223' },
        { iso: 'MT', nome: 'Malta', ddi: '356' },
        { iso: 'MA', nome: 'Marrocos', ddi: '212' },
        { iso: 'MQ', nome: 'Martinica', ddi: '596' },
        { iso: 'MU', nome: 'Maurício', ddi: '230' },
        { iso: 'MR', nome: 'Mauritânia', ddi: '222' },
        { iso: 'YT', nome: 'Mayotte', ddi: '262' },
        { iso: 'MX', nome: 'México', ddi: '52' },
        { iso: 'MM', nome: 'Myanmar', ddi: '95' },
        { iso: 'FM', nome: 'Micronésia', ddi: '691' },
        { iso: 'MZ', nome: 'Moçambique', ddi: '258' },
        { iso: 'MD', nome: 'Moldávia', ddi: '373' },
        { iso: 'MC', nome: 'Mônaco', ddi: '377' },
        { iso: 'MN', nome: 'Mongólia', ddi: '976' },
        { iso: 'ME', nome: 'Montenegro', ddi: '382' },
        { iso: 'MS', nome: 'Montserrat', ddi: '1664' },
        { iso: 'NA', nome: 'Namíbia', ddi: '264' },
        { iso: 'NR', nome: 'Nauru', ddi: '674' },
        { iso: 'NP', nome: 'Nepal', ddi: '977' },
        { iso: 'NI', nome: 'Nicarágua', ddi: '505' },
        { iso: 'NE', nome: 'Níger', ddi: '227' },
        { iso: 'NG', nome: 'Nigéria', ddi: '234' },
        { iso: 'NU', nome: 'Niue', ddi: '683' },
        { iso: 'NO', nome: 'Noruega', ddi: '47' },
        { iso: 'NC', nome: 'Nova Caledônia', ddi: '687' },
        { iso: 'NZ', nome: 'Nova Zelândia', ddi: '64' },
        { iso: 'OM', nome: 'Omã', ddi: '968' },
        { iso: 'NL', nome: 'Países Baixos', ddi: '31' },
        { iso: 'PW', nome: 'Palau', ddi: '680' },
        { iso: 'PS', nome: 'Palestina', ddi: '970' },
        { iso: 'PA', nome: 'Panamá', ddi: '507' },
        { iso: 'PG', nome: 'Papua-Nova Guiné', ddi: '675' },
        { iso: 'PK', nome: 'Paquistão', ddi: '92' },
        { iso: 'PY', nome: 'Paraguai', ddi: '595' },
        { iso: 'PE', nome: 'Peru', ddi: '51' },
        { iso: 'PF', nome: 'Polinésia Francesa', ddi: '689' },
        { iso: 'PL', nome: 'Polônia', ddi: '48' },
        { iso: 'PR', nome: 'Porto Rico', ddi: '1' },
        { iso: 'PT', nome: 'Portugal', ddi: '351' },
        { iso: 'KE', nome: 'Quênia', ddi: '254' },
        { iso: 'KG', nome: 'Quirguistão', ddi: '996' },
        { iso: 'GB', nome: 'Reino Unido', ddi: '44' },
        { iso: 'CF', nome: 'República Centro-Africana', ddi: '236' },
        { iso: 'DO', nome: 'República Dominicana', ddi: '1809' },
        { iso: 'CZ', nome: 'República Tcheca', ddi: '420' },
        { iso: 'RE', nome: 'Reunião', ddi: '262' },
        { iso: 'RO', nome: 'Romênia', ddi: '40' },
        { iso: 'RW', nome: 'Ruanda', ddi: '250' },
        { iso: 'RU', nome: 'Rússia', ddi: '7' },
        { iso: 'EH', nome: 'Saara Ocidental', ddi: '212' },
        { iso: 'WS', nome: 'Samoa', ddi: '685' },
        { iso: 'AS', nome: 'Samoa Americana', ddi: '1684' },
        { iso: 'SH', nome: 'Santa Helena', ddi: '290' },
        { iso: 'LC', nome: 'Santa Lúcia', ddi: '1758' },
        { iso: 'KN', nome: 'São Cristóvão e Névis', ddi: '1869' },
        { iso: 'SM', nome: 'São Marinho', ddi: '378' },
        { iso: 'PM', nome: 'São Pedro e Miquelão', ddi: '508' },
        { iso: 'ST', nome: 'São Tomé e Príncipe', ddi: '239' },
        { iso: 'VC', nome: 'São Vicente e Granadinas', ddi: '1784' },
        { iso: 'SC', nome: 'Seicheles', ddi: '248' },
        { iso: 'SN', nome: 'Senegal', ddi: '221' },
        { iso: 'SL', nome: 'Serra Leoa', ddi: '232' },
        { iso: 'RS', nome: 'Sérvia', ddi: '381' },
        { iso: 'SG', nome: 'Singapura', ddi: '65' },
        { iso: 'SY', nome: 'Síria', ddi: '963' },
        { iso: 'SO', nome: 'Somália', ddi: '252' },
        { iso: 'LK', nome: 'Sri Lanka', ddi: '94' },
        { iso: 'SZ', nome: 'Suazilândia', ddi: '268' },
        { iso: 'SD', nome: 'Sudão', ddi: '249' },
        { iso: 'SS', nome: 'Sudão do Sul', ddi: '211' },
        { iso: 'SE', nome: 'Suécia', ddi: '46' },
        { iso: 'CH', nome: 'Suíça', ddi: '41' },
        { iso: 'SR', nome: 'Suriname', ddi: '597' },
        { iso: 'TH', nome: 'Tailândia', ddi: '66' },
        { iso: 'TW', nome: 'Taiwan', ddi: '886' },
        { iso: 'TJ', nome: 'Tajiquistão', ddi: '992' },
        { iso: 'TZ', nome: 'Tanzânia', ddi: '255' },
        { iso: 'TL', nome: 'Timor-Leste', ddi: '670' },
        { iso: 'TG', nome: 'Togo', ddi: '228' },
        { iso: 'TO', nome: 'Tonga', ddi: '676' },
        { iso: 'TT', nome: 'Trinidad e Tobago', ddi: '1868' },
        { iso: 'TN', nome: 'Tunísia', ddi: '216' },
        { iso: 'TM', nome: 'Turcomenistão', ddi: '993' },
        { iso: 'TR', nome: 'Turquia', ddi: '90' },
        { iso: 'TV', nome: 'Tuvalu', ddi: '688' },
        { iso: 'UA', nome: 'Ucrânia', ddi: '380' },
        { iso: 'UG', nome: 'Uganda', ddi: '256' },
        { iso: 'UY', nome: 'Uruguai', ddi: '598' },
        { iso: 'UZ', nome: 'Uzbequistão', ddi: '998' },
        { iso: 'VU', nome: 'Vanuatu', ddi: '678' },
        { iso: 'VE', nome: 'Venezuela', ddi: '58' },
        { iso: 'VN', nome: 'Vietnã', ddi: '84' },
        { iso: 'ZM', nome: 'Zâmbia', ddi: '260' },
        { iso: 'ZW', nome: 'Zimbábue', ddi: '263' }
      ];

      // cópia, não referência: se `estado` apontasse pro mesmo objeto de
      // paises[0], escolher outro país sobrescrevia o Brasil dentro da
      // própria lista (o item virava uma cópia do país escolhido e
      // desaparecia da lista para sempre).
      var estado = { iso: paises[0].iso, ddi: paises[0].ddi, nome: paises[0].nome };
      var botao = $('#ddiBotao'), bandeiraEl = $('#ddiBandeira'), codigoEl = $('#ddiCodigo');
      var painel = $('#ddiPainel'), busca = $('#ddiBusca'), lista = $('#ddiLista');
      if (!botao || !painel) return estado;

      // SVG (flag-icons), não emoji: o Windows não tem os glifos de bandeira
      // do Unicode e mostra as letras do código do país em vez da bandeira.
      function bandeira(iso) {
        return '<span class="fi fi-' + iso.toLowerCase() + '"></span>';
      }

      function desenhar(filtro) {
        var termo = (filtro || '').trim().toLowerCase();
        var digitos = termo.replace(/\D/g, '');
        var itens = !termo ? paises : paises.filter(function (p) {
          return p.nome.toLowerCase().indexOf(termo) !== -1 || (!!digitos && p.ddi.indexOf(digitos) === 0);
        });

        lista.innerHTML = '';
        if (!itens.length) {
          var vazio = document.createElement('li');
          vazio.className = 'ddi__vazio';
          vazio.textContent = 'Nenhum país encontrado.';
          lista.appendChild(vazio);
          return;
        }

        itens.forEach(function (p, i) {
          var li = document.createElement('li');
          li.setAttribute('role', 'option');
          li.setAttribute('aria-selected', String(p.iso === estado.iso));
          if (i === 0) li.classList.add('ativo');
          li.innerHTML =
            '<span class="ddi__bandeira">' + bandeira(p.iso) + '</span>' +
            '<span class="ddi__pais">' + p.nome + '</span>' +
            '<span class="ddi__codigo">+' + p.ddi + '</span>';
          li.addEventListener('click', function () { escolher(p); });
          lista.appendChild(li);
        });
      }

      function escolher(p) {
        estado.iso = p.iso; estado.ddi = p.ddi; estado.nome = p.nome;
        bandeiraEl.innerHTML = bandeira(p.iso);
        codigoEl.textContent = '+' + p.ddi;

        var zapEl = $('#zap');
        if (zapEl) {
          zapEl.placeholder = p.iso === 'BR' ? '(11) 90000-0000' : 'Número com código de área';
          // ao trocar de país, o número digitado perde a máscara de DDD
          // brasileira (não existe fora daqui) e volta a ser só dígitos.
          if (zapEl.value) zapEl.value = zapEl.value.replace(/\D/g, '').slice(0, 14);
        }

        fechar();
        zapEl && zapEl.focus({ preventScroll: true });
      }

      function abrir() {
        painel.hidden = false;
        botao.setAttribute('aria-expanded', 'true');
        busca.value = '';
        desenhar('');
        busca.focus({ preventScroll: true });
        document.addEventListener('click', foraDoClique, true);
        document.addEventListener('keydown', teclado, true);
      }

      function fechar() {
        painel.hidden = true;
        botao.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', foraDoClique, true);
        document.removeEventListener('keydown', teclado, true);
      }

      function foraDoClique(ev) {
        if (!painel.contains(ev.target) && ev.target !== botao) fechar();
      }

      function teclado(ev) {
        if (ev.key === 'Escape') { fechar(); botao.focus(); return; }
        if (ev.key === 'Enter') {
          var ativo = lista.querySelector('li.ativo');
          if (ativo) ativo.click();
          ev.preventDefault();
          return;
        }
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          ev.preventDefault();
          var itens = Array.prototype.slice.call(lista.querySelectorAll('li[role="option"]'));
          if (!itens.length) return;
          var atual = itens.findIndex(function (li) { return li.classList.contains('ativo'); });
          itens.forEach(function (li) { li.classList.remove('ativo'); });
          var prox = ev.key === 'ArrowDown' ? Math.min(atual + 1, itens.length - 1) : Math.max(atual - 1, 0);
          itens[prox].classList.add('ativo');
          itens[prox].scrollIntoView({ block: 'nearest' });
        }
      }

      botao.addEventListener('click', function () {
        if (painel.hidden) abrir(); else fechar();
      });
      busca.addEventListener('input', function () { desenhar(busca.value); });

      // o Lenis intercepta a roda do mouse na página inteira; sem isso o
      // scroll dentro da lista (que já tem overflow-y próprio) não rola —
      // ele rola a página de fundo por trás do painel.
      lista.addEventListener('wheel', function (ev) {
        ev.stopPropagation();
        var noTopo = lista.scrollTop <= 0 && ev.deltaY < 0;
        var noFim = lista.scrollTop + lista.clientHeight >= lista.scrollHeight && ev.deltaY > 0;
        if (noTopo || noFim) ev.preventDefault();
      }, { passive: false });

      return estado;
    }
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  // Desarma a rede de segurança do <head>: o script assumiu.
  window.__truehopePronto = true;

  // Sem GSAP (CDN indisponível) a página volta ao modo estático: melhor uma
  // página sem movimento do que blocos presos em opacidade 0.
  if (!temGsap) document.documentElement.classList.remove('js');

  iniciarScroll();

  preloader(function () {
    // as animações de entrada só começam depois que a cortina abre
    hero();
  });

  /* ======================================================================
     8. VOZES — setas do trilho de palestrantes
     O trilho já rola sozinho (scroll nativo + scroll-snap). Isto aqui só
     liga as setas e as apaga nas pontas; sem JS, o dedo e o trackpad
     continuam funcionando e as setas ficam escondidas pelo CSS.
     ====================================================================== */
  function vozes() {
    var trilho = $('#vozesTrilho');
    if (!trilho) return;
    var setas = $$('[data-vozes]');
    if (!setas.length) return;

    var caixa = trilho.parentNode.parentNode.querySelector('.vozes__setas');
    if (caixa) caixa.removeAttribute('aria-hidden');

    var ant = null, prox = null;
    setas.forEach(function (b) {
      b.removeAttribute('tabindex');
      if (b.getAttribute('data-vozes') === 'ant') {
        ant = b;
        b.setAttribute('aria-label', 'Ver palestrantes anteriores');
      } else {
        prox = b;
        b.setAttribute('aria-label', 'Ver próximos palestrantes');
      }
      b.addEventListener('click', function () {
        var cartao = trilho.querySelector('.voz');
        if (!cartao) return;
        // um cartão + o vão entre eles
        var passo = cartao.getBoundingClientRect().width +
          parseFloat(getComputedStyle(trilho).columnGap || 0);
        trilho.scrollBy({
          left: b === ant ? -passo : passo,
          behavior: reduz ? 'auto' : 'smooth'
        });
      });
    });

    function pontas() {
      // 2px de folga: o scroll nativo raramente para no pixel exato
      var fim = trilho.scrollWidth - trilho.clientWidth;
      if (ant) ant.disabled = trilho.scrollLeft <= 2;
      if (prox) prox.disabled = trilho.scrollLeft >= fim - 2;
    }
    trilho.addEventListener('scroll', pontas, { passive: true });
    window.addEventListener('resize', pontas);
    pontas();
  }

  function montar() {
    linksDiretos();
    nav();
    reveals();
    paralaxe();
    simbolo();
    trilho();
    vozes();
    formulario();
    if (temGsap) ScrollTrigger.refresh();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(montar);
  } else {
    montar();
  }

  window.addEventListener('resize', function () {
    if (temGsap) ScrollTrigger.refresh();
  });

})();
