'use server';

import { db } from '@/lib/db';
import { Role, OperationType } from '@/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import { isAllowedImageUrl } from '@/lib/security';

export interface CreatePoolInput {
  poolPda: string;
  mintAddress: string;
  name: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  cycleDays?: number;
  operationType?: 'AUCTION' | 'DIRECT_PURCHASE';
  acquisitionCost?: number;
  renovationCost?: number;
  legalCost?: number;
  targetCapital: number;
  roiConservative: number;
  roiBase: number;
  roiOptimistic: number;
  specialistWallet: string;
}

export async function createPoolAction(data: CreatePoolInput) {
  // Validate image URL against allowlist before persisting
  if (data.imageUrl && !isAllowedImageUrl(data.imageUrl)) {
    return { success: false, error: 'Invalid image URL' };
  }

  try {
    const specialist = await db.user.upsert({
      where: { walletAddress: data.specialistWallet },
      update: {},
      create: {
        walletAddress: data.specialistWallet,
        role: Role.SPECIALIST,
      },
    });

    const pool = await db.pool.create({
      data: {
        poolPda:         data.poolPda,
        mintAddress:     data.mintAddress,
        name:            data.name,
        description:     data.description,
        imageUrl:        data.imageUrl,
        location:        data.location,
        cycleDays:       data.cycleDays,
        operationType:   data.operationType ? OperationType[data.operationType] : OperationType.DIRECT_PURCHASE,
        acquisitionCost: data.acquisitionCost,
        renovationCost:  data.renovationCost,
        legalCost:       data.legalCost,
        targetCapital:   data.targetCapital,
        roiConservative: data.roiConservative,
        roiBase:         data.roiBase,
        roiOptimistic:   data.roiOptimistic,
        specialistId:    specialist.id,
      },
    });

    // Invalidate cache for all locales via root layout
    revalidatePath('/', 'layout');

    return { success: true, poolId: pool.id };
  } catch (error) {
    console.error('[BlockFlip] Failed to save Pool to database:', error);
    return { success: false as const, error: 'Failed to create pool in database' };
  }
}

export async function getPoolsAction() {
  try {
    const pools = await db.pool.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        specialist: {
          select: { walletAddress: true },
        },
      },
    });

    return {
      success: true as const,
      data: pools.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('[BlockFlip] Failed to fetch pools from database:', error);
    return { success: false as const, error: 'Failed to fetch pools from database' };
  }
}
