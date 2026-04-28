import { mockAssets } from "@/data/mock-assets";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://blockflip.io";

/** Schema.org: BlockFlip classificado como FinancialService */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["FinancialService", "Organization"],
  "@id": `${APP_URL}/#organization`,
  name: "BlockFlip",
  alternateName: "BlockFlip Protocol",
  description:
    "Protocolo de Real World Assets (RWA) na Solana para property flipping. Tokeniza o ciclo completo: arremate judicial → reforma ágil → venda premium. ROI alvo 20-30% em ciclos de até 6 meses.",
  url: APP_URL,
  logo: {
    "@type": "ImageObject",
    url: `${APP_URL}/icon`,
    width: 512,
    height: 512,
  },
  image: `${APP_URL}/opengraph-image`,
  foundingDate: "2025",
  areaServed: {
    "@type": "Country",
    name: "Brazil",
  },
  serviceType: [
    "Real World Asset Tokenization",
    "Property Flipping Protocol",
    "Fractional Real Estate Investment",
  ],
  knowsAbout: [
    "Solana blockchain",
    "Real World Assets",
    "Property Flipping",
    "Tokenização Imobiliária",
    "SPE — Sociedade de Propósito Específico",
    "Proof of Build",
    "Token Extensions L22",
    "USDC",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Imóveis Tokenizados",
    url: `${APP_URL}/#marketplace`,
  },
  sameAs: [
    "https://twitter.com/blockflip_io",
    "https://linkedin.com/company/blockflip",
  ],
};

/** Schema.org: Cada imóvel como InvestmentProduct */
const investmentProductSchemas = mockAssets.map((asset) => ({
  "@context": "https://schema.org",
  "@type": "InvestmentOrDeposit",
  "@id": `${APP_URL}/#asset-${asset.id}`,
  name: asset.title,
  description: `Imóvel em ${asset.location} no estágio "${asset.status === "arremate" ? "Arremate Judicial" : asset.status === "em_reforma" ? "Em Reforma" : "À Venda"}". ROI estimado: ${asset.estimatedROI}%. Ciclo de ${asset.cycleDays} dias.`,
  provider: {
    "@id": `${APP_URL}/#organization`,
  },
  url: `${APP_URL}/#marketplace`,
  offers: {
    "@type": "Offer",
    price: asset.minInvestment,
    priceCurrency: "USD",
    availability:
      asset.fundingRaised < asset.fundingGoal
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
    description: `Investimento mínimo: $${asset.minInvestment} USDC. Captação: $${asset.fundingRaised.toLocaleString()} / $${asset.fundingGoal.toLocaleString()} USDC.`,
  },
  // Propriedades customizadas de investimento
  additionalProperty: [
    {
      "@type": "PropertyValue",
      name: "roi",
      value: `${asset.estimatedROI}%`,
      description: "Retorno sobre investimento estimado",
    },
    {
      "@type": "PropertyValue",
      name: "investmentTerm",
      value: `${asset.cycleDays} dias`,
      description: "Prazo do ciclo de investimento",
    },
    {
      "@type": "PropertyValue",
      name: "blockchain",
      value: "Solana",
      description: "Blockchain de custódia e liquidação",
    },
    {
      "@type": "PropertyValue",
      name: "tokenSymbol",
      value: asset.tokenSymbol,
      description: "Símbolo do token de participação",
    },
    {
      "@type": "PropertyValue",
      name: "custodyType",
      value: "SPE on-chain",
      description:
        "Ativo custodiado em Sociedade de Propósito Específico espelhada na blockchain",
    },
    {
      "@type": "PropertyValue",
      name: "verificationStatus",
      value: asset.verificationStatus,
      description: "Status de verificação da auditoria documental",
    },
  ],
}));

/** Schema.org: FAQ para GEO — responde perguntas que LLMs recebem */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "O que é Property Flipping on-chain?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Property Flipping on-chain é a tokenização do ciclo completo de compra, reforma e venda de imóveis na blockchain. No BlockFlip, investidores aportam USDC em imóveis arrematados em leilão judicial, financiam a reforma e recebem o retorno proporcional na venda com ágio, com toda a cadeia de evidências registrada on-chain no protocolo Proof of Build.",
      },
    },
    {
      "@type": "Question",
      name: "O que é Solana RWA?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Solana RWA (Real World Assets) são ativos do mundo real — imóveis, recebíveis, commodities — tokenizados e negociados na blockchain Solana. O BlockFlip é o protocolo de Solana RWA focado em property flipping imobiliário no Brasil, com transparência total via Proof of Build e custódia em SPE on-chain.",
      },
    },
    {
      "@type": "Question",
      name: "O que é Proof of Build no BlockFlip?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Proof of Build é o sistema de transparência do BlockFlip onde cada marco da obra (demolição, elétrica, acabamento) é documentado com fotos, vídeos e laudos cujos hashes são registrados imutavelmente na Solana. Investidores podem verificar o progresso real do imóvel antes de receber o retorno.",
      },
    },
    {
      "@type": "Question",
      name: "Qual o ROI médio do BlockFlip?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "O protocolo BlockFlip tem ROI alvo de 20-30% em ciclos de até 6 meses, derivado do diferencial entre o preço de arremate em leilão judicial (desconto de 30-50% sobre mercado) e o preço de venda pós-reforma premium. Cada ativo tem seu ROI projetado individual disponível no marketplace.",
      },
    },
    {
      "@type": "Question",
      name: "Como a SPE protege o investidor no BlockFlip?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cada imóvel no BlockFlip é custodiado em uma SPE (Sociedade de Propósito Específico) espelhada on-chain na Solana. A SPE isola juridicamente o ativo, protegendo investidores de riscos do operador. A tokenização via Token Extensions L22 garante que os direitos dos investidores sejam executáveis diretamente na blockchain.",
      },
    },
  ],
};

/** Schema.org: HowTo — Como investir no BlockFlip */
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Como investir em property flipping on-chain com BlockFlip",
  description:
    "Guia passo a passo para investir em imóveis tokenizados na Solana através do protocolo BlockFlip",
  totalTime: "PT5M",
  supply: [
    { "@type": "HowToSupply", name: "Wallet Solana (Phantom, Backpack ou Solflare)" },
    { "@type": "HowToSupply", name: "USDC na rede Solana (mínimo $50)" },
  ],
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Conectar Wallet",
      text: "Acesse o BlockFlip e conecte sua wallet Solana (Phantom, Backpack ou Solflare) clicando em 'Conectar Wallet'.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Explorar Marketplace",
      text: "Navegue pelos imóveis disponíveis no marketplace. Filtre por status (Arremate, Em Reforma, À Venda) e analise ROI, prazo e progresso de captação de cada ativo.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Verificar Documentos",
      text: "Acesse os documentos do imóvel (Edital do Leilão, Matrícula, Cronograma de Obra) e verifique o smart contract no Solana Explorer.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Aportar USDC",
      text: "Defina o valor a investir (mínimo $50 USDC) e confirme a transação na sua wallet. Você receberá tokens representando sua fração do imóvel.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Acompanhar Proof of Build",
      text: "Monitore o progresso da obra através do Proof of Build com marcos verificados on-chain. Ao término da venda, receba o retorno proporcional automaticamente via smart contract.",
    },
  ],
};

export function JsonLd() {
  const schemas = [
    organizationSchema,
    ...investmentProductSchemas,
    faqSchema,
    howToSchema,
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
        />
      ))}
    </>
  );
}

// SECURITY FIX (Medium): Escape characters that could break out of the <script> context.
// Without this, a value like `</script><script>alert(1)` would inject arbitrary JS.
// JSON.stringify alone does NOT escape these sequences inside script tags.
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}
