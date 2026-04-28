'use server';

import { db } from '@/lib/db';
import { Role } from '@/generated/prisma/enums';
import { revalidatePath } from 'next/cache';
import { isAllowedImageUrl } from '@/lib/security';

export interface CreatePoolInput {
  poolPda: string;
  mintAddress: string;
  name: string;
  description?: string;
  imageUrl?: string;
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
    return { success: false, error: 'Failed to create pool in database' };
  }
}
