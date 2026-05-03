# BlockFlip — Atualização de Logo + Refinamentos da Home

> Prompt para colar no Claude Code com a pasta `D:\cultura-builder\projects\BlockFlip` aberta.
> Este documento foi escrito **depois de ler o código existente** — as recomendações são cirúrgicas, não genéricas.

---

## Contexto

BlockFlip é um protocolo Web3 RWA na Solana, submetido para o **Colosseum Hackathon 2026**. O core primitive é o **skin-in-the-game on-chain** — o operador deposita 5% do funding goal numa PDA antes do pool aceitar capital de investidores.

### Stack confirmada (lendo o repo)
- Next.js 15 App Router · Tailwind v4 · shadcn/ui
- next-intl (pt-BR / en-US / es-ES)
- Anchor 0.30.1 · Solana wallet adapter
- Program ID Devnet: `8HJ9DeCCPsvadP45ironJLS2uq7WVa6wfrBLf3VxAE5T`

### Atributos da marca (norte para todas as decisões)
Sólido · Transparente · Tecnológico · Ágil · Acessível. Não pode parecer meme coin/cassino — tem que passar segurança de FII tradicional. **Web2.5**: cripto-nativo por baixo, "Dona Maria" por cima.

---

## PARTE 1 — Substituir o logo PNG por SVG vetorial

### Diagnóstico do estado atual

Encontrei **3 problemas concretos** com o logo:

1. **`public/logo-blockflip.png`** tem **2.1 MB** — peso enorme pra um logo. Está sendo usado em duas páginas com `unoptimized` no `<Image>`, então não passa por otimização do Next.
2. **Tamanho quebrado**: em `src/components/ui/navbar.tsx:38` e `src/components/footer.tsx:123` o logo tem `width={350} height={100}` mas é renderizado com `className="h-28 w-auto"` (h-28 = 112px) dentro de uma navbar de 64px (`h-16`). Está estourando o container.
3. **Identidade fragmentada**: `src/app/icon.tsx`, `src/app/apple-icon.tsx` e `src/app/opengraph-image.tsx` usam um placeholder com a letra "B" verde — não tem nada do logo novo.

### O novo logo

**Conceito**: bloco isométrico com cumeeira elevada. Existem duas variações:

| Versão | Quando usar |
|---|---|
| **Padrão** (sem janela) | Navbar, favicon, app icon, qualquer coisa < 48px |
| **Variação B** (janela + porta) | Hero da landing, OG image, materiais institucionais |

### Passo 1.1 — Criar os arquivos SVG

Crie a pasta `public/brand/` e os 6 arquivos abaixo:

**`public/brand/symbol-dark.svg`**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
  <g stroke="#F0EDE5" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="20,80 100,120 180,80 180,160 100,200 20,160" fill="none"/>
    <line x1="100" y1="120" x2="100" y2="200"/>
    <polygon points="20,80 100,20 180,80 100,120" fill="#F0EDE5"/>
  </g>
</svg>
```

**`public/brand/symbol-light.svg`** — idêntico ao acima trocando `#F0EDE5` por `#0D0E10`.

**`public/brand/symbol-window-dark.svg`** (variação B expandida — janela + porta)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
  <g stroke="#F0EDE5" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="20,80 100,120 180,80 180,160 100,200 20,160" fill="none"/>
    <line x1="100" y1="120" x2="100" y2="200"/>
    <polygon points="20,80 100,20 180,80 100,120" fill="#F0EDE5"/>
  </g>
  <polygon points="45,117.5 75,132.5 75,152.5 45,137.5" fill="none" stroke="#F0EDE5" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <polygon points="130,145 150,135 150,175 130,185" fill="none" stroke="#F0EDE5" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
</svg>
```

**`public/brand/symbol-window-light.svg`** — trocar `#F0EDE5` por `#0D0E10`.

**`public/brand/horizontal-dark.svg`** (símbolo + wordmark)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140" width="420" height="140">
  <g transform="translate(60, 70)" stroke="#F0EDE5" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="-40,-10 0,10 40,-10 40,30 0,50 -40,30" fill="none"/>
    <line x1="0" y1="10" x2="0" y2="50"/>
    <polygon points="-40,-10 0,-40 40,-10 0,10" fill="#F0EDE5"/>
  </g>
  <line x1="130" y1="35" x2="130" y2="105" stroke="#3A3A3A" stroke-width="1"/>
  <text x="150" y="86" fill="#F0EDE5" font-family="'Inter', sans-serif" font-size="42" font-weight="300" letter-spacing="0.5">block</text>
  <text x="269" y="86" fill="#F0EDE5" font-family="'Inter', sans-serif" font-size="42" font-weight="600" letter-spacing="0.5">flip</text>
</svg>
```

**`public/brand/horizontal-light.svg`** — trocar `#F0EDE5` por `#0D0E10` e `#3A3A3A` por `#C8C4B8`.

### Passo 1.2 — Criar componente Logo

Cria `src/components/brand/logo.tsx`:

```tsx
import Image from 'next/image';

type Variant = 'symbol' | 'symbol-window' | 'horizontal';
type Theme = 'dark' | 'light';

interface LogoProps {
  variant?: Variant;
  theme?: Theme;
  height?: number;
  className?: string;
  priority?: boolean;
}

const ASPECT_RATIOS: Record<Variant, number> = {
  'symbol': 200 / 220,
  'symbol-window': 200 / 220,
  'horizontal': 420 / 140,
};

export function Logo({
  variant = 'horizontal',
  theme = 'dark',
  height = 32,
  className = '',
  priority = false,
}: LogoProps) {
  const file = `${variant}-${theme}`;
  const ratio = ASPECT_RATIOS[variant];
  const width = Math.round(height * ratio);

  return (
    <Image
      src={`/brand/${file}.svg`}
      alt="BlockFlip"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
```

### Passo 1.3 — Substituir no navbar

**Arquivo:** `src/components/ui/navbar.tsx`

**Linhas 6 e 36–46** — trocar o `<Image>` direto pelo componente `<Logo>`:

```tsx
// REMOVER esta linha
import Image from 'next/image';

// ADICIONAR
import { Logo } from '@/components/brand/logo';

// Bloco que estava entre as linhas 36-46:
<Link href="/" className="flex items-center">
  <Logo variant="horizontal" theme="dark" height={28} priority />
</Link>
```

**Por quê:** o componente cuida do aspect ratio automaticamente, usa SVG (kb em vez de MB), e o `height={28}` cabe nos 64px da navbar com folga.

### Passo 1.4 — Substituir no footer

**Arquivo:** `src/components/footer.tsx`

**Linhas 4 e 121–130** — mesmo tratamento:

```tsx
// REMOVER
import Image from 'next/image';

// ADICIONAR
import { Logo } from '@/components/brand/logo';

// Bloco linhas 121-130:
<div className="flex items-center justify-center">
  <Logo variant="horizontal" theme="dark" height={32} />
</div>
```

### Passo 1.5 — Atualizar `icon.tsx` (favicon)

**Arquivo:** `src/app/icon.tsx`

Substituir o conteúdo inteiro:

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0D0E10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="22" height="24" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#F0EDE5" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round">
            <polygon points="20,80 100,120 180,80 180,160 100,200 20,160" fill="none"/>
            <line x1="100" y1="120" x2="100" y2="200"/>
            <polygon points="20,80 100,20 180,80 100,120" fill="#F0EDE5"/>
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
```

### Passo 1.6 — Atualizar `apple-icon.tsx`

**Arquivo:** `src/app/apple-icon.tsx`

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#0D0E10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="110" height="121" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#F0EDE5" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <polygon points="20,80 100,120 180,80 180,160 100,200 20,160" fill="none"/>
            <line x1="100" y1="120" x2="100" y2="200"/>
            <polygon points="20,80 100,20 180,80 100,120" fill="#F0EDE5"/>
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
```

### Passo 1.7 — Atualizar `opengraph-image.tsx`

**Arquivo:** `src/app/opengraph-image.tsx`

Substituir o bloco do "logo mark" (linhas 49–82) pela versão expandida (janela + porta). Mantém todo o resto da composição (grid, glow, headline, stats), só troca o quadradinho com letra "B" pelo símbolo:

```tsx
{/* Header */}
<div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 1 }}>
  {/* Símbolo expandido (janela + porta) */}
  <svg width="48" height="53" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#F0EDE5" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
      <polygon points="20,80 100,120 180,80 180,160 100,200 20,160" fill="none"/>
      <line x1="100" y1="120" x2="100" y2="200"/>
      <polygon points="20,80 100,20 180,80 100,120" fill="#F0EDE5"/>
    </g>
    <polygon points="45,117.5 75,132.5 75,152.5 45,137.5" fill="none" stroke="#F0EDE5" strokeWidth="3"/>
    <polygon points="130,145 150,135 150,175 130,185" fill="none" stroke="#F0EDE5" strokeWidth="3"/>
  </svg>
  <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>BlockFlip</span>
  {/* manter o badge "Solana RWA" como está */}
</div>
```

### Passo 1.8 — Limpar arquivos antigos

Após confirmar que tudo funciona:

1. Deletar `public/logo-blockflip.png` (2.1 MB economizados no bundle)
2. Mover a pasta `Logos/` (na raiz do projeto) para fora ou para `docs/old-logos/` — não deve estar sendo deployada
3. Atualizar `public/manifest.json`:
   ```json
   "background_color": "#0D0E10",
   "icons": [
     { "src": "/icon", "sizes": "32x32", "type": "image/png", "purpose": "any" },
     { "src": "/apple-icon", "sizes": "180x180", "type": "image/png", "purpose": "any maskable" }
   ]
   ```
4. Em `src/app/[locale]/layout.tsx:113`, trocar `apple: [{ url: "/logo-blockflip.png", ...`  por  `apple: [{ url: "/apple-icon", ...`

### Passo 1.9 — Decisão importante sobre cor de acento

O projeto usa `#14F195` (Solana green) **massivamente** — em CTAs, badges, glows, ícones. **Recomendo manter** essa cor como acento, pelos seguintes motivos:

- É uma submissão pro Colosseum Hackathon — sinaliza alinhamento com o ecossistema
- Já está coerentemente aplicada em todo o produto
- O logo monocromático em off-white **não compete** com o verde como acento

Ou seja: **logo em off-white** + **acentos em Solana green** funciona como um sistema. Não precisa mexer no `globals.css` ou em todos os usos de `#14F195` no código.

A única coisa que sugiro reavaliar é o **`text-gradient-solana`** (linha 142–147 do `globals.css`) que usa `#14F195 → #9945FF` (verde + roxo Solana). O roxo bate com a estética "meme coin" que o brief queria evitar. Considere trocar por:

```css
.text-gradient-solana {
  background: linear-gradient(135deg, #14F195 0%, #F0EDE5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

(verde → off-white em vez de verde → roxo)

---

## PARTE 2 — Refinamentos da Home

> A home **não precisa ser reescrita**. A estrutura está sólida: Hero → Marketplace → UnitEconomics → BuildCycle → Footer. Os refinamentos abaixo são cirúrgicos, ordenados por impacto.

### #1 (alto impacto) — Adicionar visualização do "Skin-in-the-Game" entre UnitEconomics e BuildCycle

**Por quê:** O skin-in-the-game É o seu core primitive (lê o `README.md:19`: *"BlockFlip enforces builder accountability on-chain. No pool goes live until the operator puts skin in the game"*). Mas a home não menciona isso em lugar nenhum. É a oportunidade #1 perdida.

Cria `src/components/skin-in-the-game.tsx`:

```tsx
'use client';

import { Lock, Shield, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

export function SkinInTheGame() {
  const t = useTranslations('skinInTheGame');

  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('description')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <Lock className="w-8 h-8 text-[#14F195] mb-4" />
            <h3 className="font-semibold mb-2">{t('card1Title')}</h3>
            <p className="text-sm text-muted-foreground">{t('card1Description')}</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <Shield className="w-8 h-8 text-[#14F195] mb-4" />
            <h3 className="font-semibold mb-2">{t('card2Title')}</h3>
            <p className="text-sm text-muted-foreground">{t('card2Description')}</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <CheckCircle2 className="w-8 h-8 text-[#14F195] mb-4" />
            <h3 className="font-semibold mb-2">{t('card3Title')}</h3>
            <p className="text-sm text-muted-foreground">{t('card3Description')}</p>
          </div>
        </div>

        {/* Visualização da divisão de capital */}
        <div className="mt-12 p-8 rounded-2xl bg-card border border-border max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground mb-3 text-center">{t('split')}</p>
          <div className="flex h-12 rounded-lg overflow-hidden">
            <div className="flex-[5] bg-[#14F195] flex items-center justify-center">
              <span className="text-black text-sm font-bold">5% operador</span>
            </div>
            <div className="flex-[95] bg-secondary flex items-center justify-center border-l-2 border-background">
              <span className="text-sm font-medium">95% investidores</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {t('splitNote')}
          </p>
        </div>
      </div>
    </section>
  );
}
```

Adicionar as strings em `messages/pt-BR.json`, `en-US.json`, `es-ES.json`:

```json
"skinInTheGame": {
  "badge": "Skin in the Game",
  "title": "O operador entra com o capital dele primeiro.",
  "description": "Antes do pool aceitar o primeiro USDC dos investidores, o operador deposita 5% do funding goal numa PDA. Os incentivos estão alinhados desde o bloco zero.",
  "card1Title": "Travado on-chain",
  "card1Description": "5% do operador ficam locked no Pool Vault. Não podem ser sacados até o ciclo de venda.",
  "card2Title": "Estado obrigatório",
  "card2Description": "O Anchor program transiciona de Pending → Funding APENAS após o depósito. Sem isso, o pool não aceita capital.",
  "card3Title": "Auditável publicamente",
  "card3Description": "Todo depósito tem signature verificável no Solscan. Transparência radical.",
  "split": "Divisão típica de capital por pool",
  "splitNote": "Operador recebe sua parte do lucro proporcional ao 5%. Investidores recebem proporcional aos 95%."
}
```

E em `src/app/[locale]/page.tsx`, importar e adicionar entre `<UnitEconomics />` e `<BuildCycle />`.

### #2 (alto impacto) — Trust strip abaixo das stats no Hero

**Por quê:** O hero atual tem 3 stat cards bem feitos (ROI 20-30%, ciclo <6 meses, transparência 100%) mas falta validação social/técnica imediata. Investidor tradicional precisa ver "auditado por X" antes de scrollar.

**Arquivo:** `src/components/hero.tsx`, depois do bloco `</div>` que fecha as stats (linha 75), adicionar:

```tsx
{/* Trust strip */}
<div className="mt-12 pt-8 border-t border-border/50">
  <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
    {t('trustLabel')}
  </p>
  <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
    <span className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full" />
      {t('trustOnchain')}
    </span>
    <span className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full" />
      {t('trustSPE')}
    </span>
    <span className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full" />
      {t('trustOpenSource')}
    </span>
    <span className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full" />
      {t('trustSolana')}
    </span>
  </div>
</div>
```

E em `messages/pt-BR.json`, adicionar dentro de `"hero"`:

```json
"trustLabel": "Garantias do protocolo",
"trustOnchain": "Smart contracts open-source",
"trustSPE": "Custódia em SPE auditada",
"trustOpenSource": "Skin-in-the-game on-chain",
"trustSolana": "Auditável no Solscan"
```

### #3 (médio impacto) — Live data nas stats do Hero

**Por quê:** As stats atuais são estáticas ("20-30%"). Cripto-nativo respeita números reais que mudam. Pelo menos um dos cards deveria puxar dado on-chain.

**Sugestão:** trocar o card de "Transparência On-chain 100%" por **TVL em tempo real**, lendo dos pools criados (você já tem `getPoolsAction()` em `src/actions/pool.ts`).

```tsx
// Cria um hook src/hooks/use-protocol-stats.ts
import { useEffect, useState } from 'react';
import { getPoolsAction } from '@/actions/pool';

export function useProtocolStats() {
  const [stats, setStats] = useState({ tvl: 0, activePools: 0, loading: true });

  useEffect(() => {
    getPoolsAction().then((pools) => {
      const tvl = pools.reduce((acc, p) => acc + (p.fundingGoal ?? 0), 0);
      setStats({ tvl, activePools: pools.length, loading: false });
    }).catch(() => setStats((s) => ({ ...s, loading: false })));
  }, []);

  return stats;
}
```

Use no Hero substituindo o stat de transparência:

```tsx
const { tvl, activePools, loading } = useProtocolStats();

// Card:
<div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border">
  <Activity className="w-8 h-8 text-[#14F195] mb-3" />
  <span className="text-3xl font-bold mb-1">
    {loading ? '—' : `$${(tvl / 1000).toFixed(1)}K`}
  </span>
  <span className="text-sm text-muted-foreground">{t('statTVL')}</span>
</div>
```

### #4 (médio impacto) — Footer com links reais

**Por quê:** `src/components/footer.tsx:142-150` tem 3 links sociais com `href="#"`. Isso desvaloriza pra qualquer investidor que clique.

**Substituir** por links reais (mesmo que sejam discord/X vazios, melhor que `#`):

```tsx
<a
  href="https://x.com/blockflip_io"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="X (Twitter)"
  className="..."
>
  <XIcon className="w-5 h-5" />
</a>
<a href="https://discord.gg/blockflip" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="...">
  <MessageCircle className="w-5 h-5" />
</a>
<a href="https://github.com/[seu-org]/BlockFlip" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="...">
  <GitHubIcon className="w-5 h-5" />
</a>
```

E adicionar **link público pro Program ID** logo abaixo:

```tsx
<div className="mt-4 text-center text-xs text-muted-foreground">
  <span>{t('programId')}: </span>
  <a
    href="https://solscan.io/account/8HJ9DeCCPsvadP45ironJLS2uq7WVa6wfrBLf3VxAE5T?cluster=devnet"
    target="_blank"
    rel="noopener noreferrer"
    className="font-mono hover:text-[#14F195] transition-colors"
  >
    8HJ9...AE5T
  </a>
</div>
```

### #5 (médio impacto) — FAQ real (não mais "coming soon")

**Por quê:** As linhas 134–137 do footer abrem um modal "Em breve disponível" pra Docs/Whitepaper/FAQ/Contato. Pra investidor tradicional, FAQ vazio = sinal de produto incompleto.

**Sugestão**: criar `src/components/faq.tsx` com pelo menos 5 perguntas reais (use `<details>` HTML nativo, sem dependência):

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

const FAQ_KEYS = ['receive', 'risk', 'crypto', 'documents', 'fees'] as const;

export function FAQ() {
  const t = useTranslations('faq');

  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 mb-4">
            {t('badge')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('title')}</h2>
        </div>
        <div className="space-y-2">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group rounded-xl bg-card border border-border overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer p-5 hover:bg-secondary/50 transition-colors">
                <span className="font-medium">{t(`q.${key}.q`)}</span>
                <span className="text-muted-foreground group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                {t(`q.${key}.a`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Strings (perguntas baseadas em objeções reais de RWA):

```json
"faq": {
  "badge": "Perguntas Frequentes",
  "title": "Tudo que você precisa saber",
  "q": {
    "receive": {
      "q": "Como recebo meu retorno?",
      "a": "Em USDC, automaticamente, quando o imóvel é vendido. O smart contract distribui proporcionalmente aos token holders sem intervenção manual."
    },
    "risk": {
      "q": "E se a obra atrasar ou o imóvel não vender?",
      "a": "O operador colocou 5% do próprio capital travado no pool desde o início (skin-in-the-game). Se houver prejuízo, ele perde primeiro. Os investidores só perdem depois que os 5% do operador foram totalmente consumidos."
    },
    "crypto": {
      "q": "Preciso entender de cripto?",
      "a": "Não. Você pode logar com Google e a plataforma cria sua wallet automaticamente. Você só precisa de USDC pra investir — pode comprar com PIX em algumas exchanges."
    },
    "documents": {
      "q": "Os imóveis são reais? Posso ver matrícula?",
      "a": "Sim. Cada pool tem documentos públicos: matrícula, laudo de avaliação, fotos antes/depois e cronograma da reforma. Tudo linkado direto do marketplace."
    },
    "fees": {
      "q": "Quais são as taxas?",
      "a": "1% sobre o aporte (taxa de protocolo, descontada no momento da compra) + gas da Solana (alguns centavos por transação). Sem taxas escondidas, sem performance fee na saída."
    }
  }
}
```

Adicionar `<FAQ />` em `src/app/[locale]/page.tsx` antes do `<Footer />`.

E **remover os modais "coming soon"** do FAQ no footer — agora vira um link âncora pra `#faq`.

### #6 (baixo impacto, alto polish) — Hero loading state

Quando `useProtocolStats()` está carregando, em vez de mostrar `—` use um skeleton. Mantém o ar profissional.

### #7 (baixo impacto) — Dark/light mode coerência do logo

O componente `<Logo />` recebe `theme` como prop. Pra se adaptar automaticamente ao tema (já que tem `<ModeToggle />`), use a versão "currentColor". Cria uma versão extra:

**`public/brand/horizontal-current.svg`**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140" width="420" height="140" style="color: currentColor">
  <g transform="translate(60, 70)" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="-40,-10 0,10 40,-10 40,30 0,50 -40,30" fill="none"/>
    <line x1="0" y1="10" x2="0" y2="50"/>
    <polygon points="-40,-10 0,-40 40,-10 0,10" fill="currentColor"/>
  </g>
  <line x1="130" y1="35" x2="130" y2="105" stroke="currentColor" stroke-opacity="0.2" stroke-width="1"/>
  <text x="150" y="86" fill="currentColor" font-family="'Inter', sans-serif" font-size="42" font-weight="300" letter-spacing="0.5">block</text>
  <text x="269" y="86" fill="currentColor" font-family="'Inter', sans-serif" font-size="42" font-weight="600" letter-spacing="0.5">flip</text>
</svg>
```

Aí o navbar pode usar `<Logo variant="horizontal" theme="current" className="text-foreground" />` e ele vira automaticamente com o tema. (Ajuste o componente Logo pra suportar `'current'` como theme.)

---

## Ordem de execução recomendada

1. **Branch `feature/rebrand`** — todos os passos da Parte 1 (logo) em commits separados
2. Validar visualmente em dev (especialmente navbar, footer, OG image)
3. **Merge da Parte 1** antes de começar a Parte 2
4. **Branch `feature/home-refinements`** — começar pelo refinamento #1 (Skin-in-the-Game), o de maior impacto
5. Os outros refinamentos podem entrar separadamente conforme prioridade
6. **NÃO executar tudo de uma vez** — cada um é um PR.

## O que NÃO mexer (já está bom)

- Estrutura de IA (Hero → Marketplace → UnitEconomics → BuildCycle → Footer) — sólida
- Solana green como cor de acento — coerente com posicionamento
- Componentes shadcn/ui — bem usados
- i18n — bem estruturado
- Mock data e SSR setup — funcionam

## Arquivos de referência

Os SVGs e o preview HTML estão em:
- `outputs/blockflip-symbol-{dark,light}.svg`
- `outputs/blockflip-symbol-window-{dark,light}.svg`
- `outputs/blockflip-horizontal-{dark,light}.svg`
- `outputs/blockflip-horizontal-window-{dark,light}.svg`
- `outputs/blockflip-vertical-{dark,light}.svg`
- `outputs/blockflip-vertical-window-{dark,light}.svg`
- `outputs/blockflip-preview.html` (kit completo com botões de export PNG)
