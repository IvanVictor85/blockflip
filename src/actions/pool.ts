'use server';

import { db } from '@/lib/db';
import { Role, OperationType } from '@/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import { isAllowedImageUrl } from '@/lib/security';

// ─── Image management ─────────────────────────────────────────────────────────

export async function addPoolImagesAction(poolPda: string, imageUrls: string[]) {
  const validUrls = imageUrls.filter((u) => isAllowedImageUrl(u));
  if (validUrls.length === 0) return { success: false, error: 'No valid image URLs' };

  try {
    const pool = await db.pool.findUnique({ where: { poolPda } });
    if (!pool) return { success: false, error: 'Pool not found' };

    await db.poolImage.createMany({
      data: validUrls.map((url, i) => ({ url, order: i, poolId: pool.id })),
    });

    // Set primary imageUrl if pool doesn't have one yet
    if (!pool.imageUrl) {
      await db.pool.update({ where: { poolPda }, data: { imageUrl: validUrls[0] } });
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('[BlockFlip] Failed to save pool images:', error);
    return { success: false, error: 'Failed to save images' };
  }
}

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
        specialist: { select: { walletAddress: true } },
        images: { orderBy: { order: 'asc' }, select: { url: true } },
      },
    });

    return {
      success: true as const,
      data: pools.map((p) => ({
        ...p,
        imageUrls: p.images.map((img) => img.url),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('[BlockFlip] Failed to fetch pools from database:', error);
    return { success: false as const, error: 'Failed to fetch pools from database' };
  }
}
