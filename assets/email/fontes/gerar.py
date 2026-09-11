# -*- coding: utf-8 -*-
"""
Regenera as imagens do e-mail (assets/email/img/).

    python assets/email/fontes/gerar.py

O banner do topo e o ícone do cupom são renderizados no navegador (Playwright),
e não desenhados na mão, porque assim a tipografia sai com a Prata de verdade —
a mesma fonte do site. Em e-mail não dá para confiar em @font-face, então o
título do banner vira imagem; é o único jeito de a Prata aparecer em qualquer
caixa de entrada.

Precisa de: pip install playwright pillow && playwright install msedge
"""
import os
from PIL import Image, ImageDraw, ImageEnhance
from playwright.sync_api import sync_playwright

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
FONTES = os.path.join(RAIZ, 'assets', 'email', 'fontes')
SAIDA = os.path.join(RAIZ, 'assets', 'email', 'img')
IMG = os.path.join(RAIZ, 'assets', 'img')
os.makedirs(SAIDA, exist_ok=True)


def renderizar(html, png, w, h, transparente=False):
    """Abre o HTML no navegador em 2x e fotografa."""
    with sync_playwright() as p:
        nav = p.chromium.launch(channel='msedge')
        pg = nav.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
        pg.goto('file:///' + os.path.join(FONTES, html).replace('\\', '/'))
        pg.wait_for_timeout(2500)   # espera a fonte do Google carregar
        pg.screenshot(path=png, omit_background=transparente)
        nav.close()


def cobrir(origem, destino, w, h, qualidade=84, vies=0.42):
    """Recorta na proporção pedida (com viés vertical) e salva em JPEG."""
    im = Image.open(origem).convert('RGB')
    sw, sh = im.size
    alvo, atual = w / h, sw / sh
    if atual > alvo:
        nw = int(sh * alvo)
        im = im.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    else:
        nh = int(sw / alvo)
        y0 = int((sh - nh) * vies)
        im = im.crop((0, y0, sw, y0 + nh))
    im.resize((w, h), Image.LANCZOS).save(destino, 'JPEG', quality=qualidade, optimize=True)


# ---------------------------------------------------------------- banner
tmp = os.path.join(SAIDA, '_hero.png')
renderizar('hero.html', tmp, 560, 320)
Image.open(tmp).convert('RGB').save(os.path.join(SAIDA, 'hero.jpg'), 'JPEG', quality=84, optimize=True)
os.remove(tmp)

# ---------------------------------------------------- ícone do cupom (com alfa)
renderizar('icone.html', os.path.join(SAIDA, 'icone-cupom.png'), 38, 38, transparente=True)

# ------------------------------------------------- monograma TH (mesmos rects do site)
ESCALA = 6
mono = Image.new('RGBA', (211 * ESCALA, 294 * ESCALA), (0, 0, 0, 0))
d = ImageDraw.Draw(mono)
for x, y, w, h in [(0, 0, 211, 33), (90, 0, 33, 294), (155, 65, 33, 207), (123, 151, 32, 33)]:
    d.rectangle([x * ESCALA, y * ESCALA, (x + w) * ESCALA, (y + h) * ESCALA], fill=(31, 34, 26, 255))
mono.save(os.path.join(SAIDA, 'logo-th.png'))

# ------------------------------------------------------------- foto da collab
# JPEG e não WEBP: o Outlook para Windows não abre WEBP.
# Alta o bastante para encher o card inteiro — se ficar menor que a coluna de
# texto ao lado, sobra um vazio embaixo da foto.
cobrir(os.path.join(IMG, 'pc-camisa.webp'), os.path.join(SAIDA, 'foto-camisa.jpg'), 392, 600, vies=0.34)

# --------------------------------------------- foto da comunidade (folhagem escurecida)
arcos = Image.open(os.path.join(IMG, 'hero-arcos.webp')).convert('RGB')
W, H = arcos.size
lw = int(W * 0.24)
lh = int(lw * 410 / 240)
x0, y0 = int(W * 0.14), min(int(H * 0.06), max(0, H - lh))
c = arcos.crop((x0, y0, x0 + lw, y0 + lh)).resize((240, 410), Image.LANCZOS)
c = ImageEnhance.Brightness(c).enhance(0.44)
c = ImageEnhance.Contrast(c).enhance(1.16)
c = ImageEnhance.Color(c).enhance(0.72)
c.save(os.path.join(SAIDA, 'foto-comunidade.jpg'), 'JPEG', quality=84, optimize=True)

print('imagens do e-mail regeradas em', SAIDA)
