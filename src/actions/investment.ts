'use server';

import { db } from '@/lib/db';
import { Role } from '@/generated/prisma/enums';
import { revalidatePath } from 'next/cache';

export interface CreateInvestmentInput {
  poolPda: string;
  investorWallet: string;
  amount: number;
  txHash: string;
}

export async function createInvestmentAction(data: CreateInvestmentInput) {
  try {
    const pool = await db.pool.findUnique({
      where: { poolPda: data.poolPda },
      select: { id: true },
    });

    if (!pool) {
      return { success: false as const, error: 'Pool not found in database.' };
    }

    const investor = await db.user.upsert({
      where: { walletAddress: data.investorWallet },
      update: {},
      create: {
        walletAddress: data.investorWallet,
        role: Role.INVESTOR,
      },
    });

    const [investment, updatedPool] = await db.$transaction([
      db.investment.create({
        data: {
          amount:  data.amount,
          txHash:  data.txHash,
          userId:  investor.id,
          poolId:  pool.id,
        },
      }),
      db.pool.update({
        where: { id: pool.id },
        data: { raisedCapital: { increment: data.amount } },
      }),
    ]);

    revalidatePath('/', 'layout');

    return {
      success: true as const,
      investmentId: investment.id,
      currentRaised: updatedPool.raisedCapital,
    };
  } catch (error) {
    // P2002 = unique constraint violation — txHash already recorded (idempotent)
    if ((error as { code?: string }).code === 'P2002') {
      return { success: true as const, investmentId: null, currentRaised: null };
    }
    console.error('[BlockFlip] Failed to record investment:', error);
    return { success: false as const, error: 'Failed to record investment.' };
  }
}
