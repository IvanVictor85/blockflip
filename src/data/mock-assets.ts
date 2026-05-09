import { Asset, UnitEconomicsData } from '@/types';

export const mockAssets: Asset[] = [
  {
    id: 'asset-001',
    title: 'Apartamento Pinheiros',
    location: 'Pinheiros, São Paulo - SP',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    status: 'em_reforma',
    acquisitionPrice: 380000,
    targetSalePrice: 520000,
    estimatedROI: 28,
    cycleDays: 120,
    currentDay: 45,
    fundingGoal: 450000,
    fundingRaised: 387000,
    fundingCurrency: 'USDC',
    milestones: [
      {
        id: 'ms-001',
        title: 'Demolição',
        description: 'Remoção de revestimentos e paredes não estruturais',
        status: 'completed',
        completedAt: '2024-01-15',
        evidenceHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        evidenceType: 'photo',
      },
      {
        id: 'ms-002',
        title: 'Elétrica & Hidráulica',
        description: 'Nova infraestrutura completa',
        status: 'completed',
        completedAt: '2024-02-01',
        evidenceHash: '0x2c624232cdd221771294dfbb3106adabb5f3367bd2ffdb28d17ca2d45a505b13',
        evidenceType: 'photo',
      },
      {
        id: 'ms-003',
        title: 'Alvenaria',
        description: 'Novo layout e paredes',
        status: 'in_progress',
        evidenceType: 'photo',
      },
      {
        id: 'ms-004',
        title: 'Acabamento',
        description: 'Pisos, revestimentos e pintura',
        status: 'pending',
      },
      {
        id: 'ms-005',
        title: 'Finalização',
        description: 'Marcenaria, iluminação e limpeza final',
        status: 'pending',
      },
    ],
    tokenSymbol: 'BFLP-001',
    totalTokens: 4500,
    minInvestment: 100,
    smartContractAddress: 'FLiP7x9Y2K3m5N8pQ6rS9tU1vW2xZ4A5b6C7d8E9f0G1h2I3',
    speAddress: 'SPE4k7L9m2N5p8Q1r4S7t0U3v6W9x2Z5a8B1c4D7e0F3g6H9',
    verificationStatus: 'verified' as const,
    documents: [
      {
        id: 'doc-001',
        title: 'Edital do Leilão - 4ª Vara Cível SP',
        type: 'edital_leilao',
        url: '#',
        uploadedAt: '2023-12-15',
        verified: true,
        hash: '0x8f94ba11c2e7f5f8c6b4d7a9e2f3c8d5b9e6f2a7c4d8e1f5b3c9d2e6f0a4b7c1',
      },
      {
        id: 'doc-002',
        title: 'Matrícula Atualizada - RGI SP',
        type: 'matricula',
        url: '#',
        uploadedAt: '2023-12-18',
        verified: true,
        hash: '0x7e83a50f1d6c4b8e2a5d9f3c6e0b4d8f1e5a9c2d6f3b7e0a4c8d1f5b9e2a6c3',
      },
      {
        id: 'doc-003',
        title: 'Cronograma de Obra Detalhado',
        type: 'cronograma_obra',
        url: '#',
        uploadedAt: '2024-01-10',
        verified: true,
        hash: '0x6d72a40e0c5b3a7d1e4c8f2b5e9a3d7e0d4a8b1c5f2e6a9c3f6b0d4e7a1c5f8',
      },
    ],
  },
  {
    id: 'asset-002',
    title: 'Sobrado Vila Madalena',
    location: 'Vila Madalena, São Paulo - SP',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    status: 'arremate',
    acquisitionPrice: 620000,
    targetSalePrice: 850000,
    estimatedROI: 24,
    cycleDays: 150,
    currentDay: 0,
    fundingGoal: 720000,
    fundingRaised: 156000,
    fundingCurrency: 'USDC',
    milestones: [
      {
        id: 'ms-101',
        title: 'Arrematação',
        description: 'Aquisição em leilão judicial',
        status: 'in_progress',
      },
      {
        id: 'ms-102',
        title: 'Demolição',
        description: 'Remoção de estruturas antigas',
        status: 'pending',
      },
      {
        id: 'ms-103',
        title: 'Estrutural',
        description: 'Reforço e novas fundações',
        status: 'pending',
      },
      {
        id: 'ms-104',
        title: 'Elétrica & Hidráulica',
        description: 'Nova infraestrutura',
        status: 'pending',
      },
      {
        id: 'ms-105',
        title: 'Acabamento Premium',
        description: 'Alto padrão de finalização',
        status: 'pending',
      },
    ],
    tokenSymbol: 'BFLP-002',
    totalTokens: 7200,
    minInvestment: 100,
    smartContractAddress: 'FLiP8y0Z3L4n6O9qR2sT5uV8wX1yA6b9C2d5E8f1G4h7I0j3',
    speAddress: 'SPE5m8N1o4P7q0R3s6T9u2V5w8X1z4A7b0C3d6E9f2G5h8I1',
    verificationStatus: 'pending' as const,
    documents: [
      {
        id: 'doc-101',
        title: 'Edital do Leilão - 12ª Vara Cível SP',
        type: 'edital_leilao',
        url: '#',
        uploadedAt: '2024-02-01',
        verified: true,
        hash: '0x9a85b60f2e7c5c9f3b6e0d4a8f2c5e9b2f6a0c3e7f0a4c7e1d5f8b2c6e9f3a0',
      },
      {
        id: 'doc-102',
        title: 'Matrícula e Certidões',
        type: 'matricula',
        url: '#',
        uploadedAt: '2024-02-05',
        verified: false,
        hash: '0x8b74a51e1d6b4c8e2a5d9f3c6e0b4d8f1e5a9c2d6f3b7e0a4c8d1f5b9e2a6c3',
      },
    ],
  },
  {
    id: 'asset-003',
    title: 'Cobertura Moema',
    location: 'Moema, São Paulo - SP',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    status: 'venda',
    acquisitionPrice: 890000,
    targetSalePrice: 1250000,
    estimatedROI: 31,
    cycleDays: 90,
    currentDay: 90,
    fundingGoal: 980000,
    fundingRaised: 980000,
    fundingCurrency: 'USDC',
    milestones: [
      {
        id: 'ms-201',
        title: 'Demolição',
        description: 'Remoção completa de acabamentos',
        status: 'completed',
        completedAt: '2023-11-10',
        evidenceHash: '0x3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278',
        evidenceType: 'photo',
      },
      {
        id: 'ms-202',
        title: 'Elétrica & Hidráulica',
        description: 'Automação residencial completa',
        status: 'completed',
        completedAt: '2023-11-28',
        evidenceHash: '0x8b7df143d91c716ecfa5fc1925ee857f4d4d6e83f3e4e2a4f47ab12a889db8f9',
        evidenceType: 'video',
      },
      {
        id: 'ms-203',
        title: 'Acabamento Luxo',
        description: 'Mármore, porcelanato e madeira nobre',
        status: 'completed',
        completedAt: '2023-12-20',
        evidenceHash: '0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658',
        evidenceType: 'photo',
      },
      {
        id: 'ms-204',
        title: 'Paisagismo',
        description: 'Terraço gourmet com jardim',
        status: 'completed',
        completedAt: '2024-01-05',
        evidenceHash: '0xb17ef6d19c7a5b1ee83b907c5c6bc7c16e0c7d9c7b8b8c6a6b5c4d3e2f1a0b9c',
        evidenceType: 'photo',
      },
      {
        id: 'ms-205',
        title: 'Pronto para Venda',
        description: 'Documentação e marketing',
        status: 'completed',
        completedAt: '2024-01-15',
        evidenceHash: '0xc3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
        evidenceType: 'document',
      },
    ],
    tokenSymbol: 'BFLP-003',
    totalTokens: 9800,
    minInvestment: 100,
    smartContractAddress: 'FLiP9z1A4M5o7P0rS3tU6vW9xY2zA5c8D1e4F7g0H3i6J9k2',
    speAddress: 'SPE6n9O2p5Q8r1S4t7U0v3W6x9Y2z5A8b1C4d7E0f3G6h9I2',
    verificationStatus: 'verified' as const,
    documents: [
      {
        id: 'doc-201',
        title: 'Edital do Leilão Finalizado',
        type: 'edital_leilao',
        url: '#',
        uploadedAt: '2023-10-20',
        verified: true,
        hash: '0xab96c71f3f8d6d0g4c7f1e5b9f3d6f0c4f7e2f6a0d4f7e1c5f8b3d6f0c4e7f1',
      },
      {
        id: 'doc-202',
        title: 'Matrícula Limpa - RGI SP',
        type: 'matricula',
        url: '#',
        uploadedAt: '2023-10-25',
        verified: true,
        hash: '0xac85b62g2g7d5d9g3c6g0e4b8g2c5f9b2g6a9c3g7g9a4c7g1d5g8b2c6g9g3a9',
      },
      {
        id: 'doc-203',
        title: 'Laudo Técnico Pós-Obra',
        type: 'laudo_tecnico',
        url: '#',
        uploadedAt: '2024-01-20',
        verified: true,
        hash: '0xbd74a53h1h6c4c8h2a5h9g3c6h0b4h8g1h5a9c2h6g3b7h0a4c8h1g5b9h2a6c3',
      },
    ],
  },
  {
    id: 'asset-004',
    title: 'Studio Consolação',
    location: 'Consolação, São Paulo - SP',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    status: 'em_reforma',
    acquisitionPrice: 195000,
    targetSalePrice: 285000,
    estimatedROI: 32,
    cycleDays: 75,
    currentDay: 30,
    fundingGoal: 250000,
    fundingRaised: 250000,
    fundingCurrency: 'USDC',
    milestones: [
      {
        id: 'ms-301',
        title: 'Demolição',
        description: 'Limpeza completa do espaço',
        status: 'completed',
        completedAt: '2024-01-20',
        evidenceHash: '0xd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
        evidenceType: 'photo',
      },
      {
        id: 'ms-302',
        title: 'Elétrica',
        description: 'Novo quadro e pontos',
        status: 'in_progress',
        evidenceType: 'photo',
      },
      {
        id: 'ms-303',
        title: 'Design Compacto',
        description: 'Marcenaria inteligente',
        status: 'pending',
      },
      {
        id: 'ms-304',
        title: 'Finalização',
        description: 'Acabamentos e decoração',
        status: 'pending',
      },
    ],
    tokenSymbol: 'BFLP-004',
    totalTokens: 2500,
    minInvestment: 50,
    smartContractAddress: 'FLiP0a2B5N6p8Q1rS4tU7vW0xY3zA6c9D2e5F8g1H4i7J0k3',
    speAddress: 'SPE7o0P3q6R9s2T5u8V1w4X7y0Z3a6B9c2D5e8F1g4H7i0J3',
    verificationStatus: 'verified' as const,
    documents: [
      {
        id: 'doc-301',
        title: 'Edital do Leilão - 8ª Vara Cível SP',
        type: 'edital_leilao',
        url: '#',
        uploadedAt: '2024-01-05',
        verified: true,
        hash: '0xce63a42i0i5a3b7i1i4b8g2b5i9a3i7i0i4a8b1i5g2i6a9i3g6b0i4i7a1i5g8',
      },
      {
        id: 'doc-302',
        title: 'Matrícula e Projeto Aprovado',
        type: 'matricula',
        url: '#',
        uploadedAt: '2024-01-10',
        verified: true,
        hash: '0xdf52a31j9j4a2c6j0j3c7h1c4j8a2j6j9j3a7c0j4h1j5a8j2h5c9j3a6j9j2a8',
      },
    ],
  },
];

export const mockUnitEconomics: UnitEconomicsData = {
  acquisitionCost: 380000,
  reformCost: 55000,
  operationalCost: 15000,
  totalCost: 450000,
  targetSalePrice: 565000,
  grossProfit: 115000,
  netProfit: 115000,
  investorShare: 69000,    // 60% of 115,000 (15.3% ROI)
  operatorShare: 23000,    // 20% of 115,000
  protocolFee: 23000,      // 20% of 115,000
};

export const formatCurrency = (value: number, currency: string = 'USDC'): string => {
  if (currency === 'USDC') {
    return `${value.toLocaleString('en-US')} USDC`;
  }
  if (currency === 'EUR') {
    return `€${value.toLocaleString('es-ES')}`;
  }
  return `R$ ${value.toLocaleString('pt-BR')}`;
};

// Fixed reference rates (Apr 2026). Replace with live API when ready.
const USDC_TO_BRL = 5.70;
const USDC_TO_EUR = 0.92;

export const formatBRL = (usdc: number): string => {
  const brl = usdc * USDC_TO_BRL;
  if (brl >= 1_000_000) return `≈ R$ ${(brl / 1_000_000).toFixed(1)}M`;
  if (brl >= 1_000) return `≈ R$ ${(brl / 1_000).toFixed(0)}K`;
  return `≈ R$ ${Math.round(brl).toLocaleString('pt-BR')}`;
};

export const formatEUR = (usdc: number): string => {
  const eur = usdc * USDC_TO_EUR;
  if (eur >= 1_000_000) return `≈ €${(eur / 1_000_000).toFixed(1)}M`;
  if (eur >= 1_000) return `≈ €${(eur / 1_000).toFixed(0)}K`;
  return `≈ €${Math.round(eur).toLocaleString('es-ES')}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
