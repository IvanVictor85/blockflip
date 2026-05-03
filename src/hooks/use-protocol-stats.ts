'use client';

import { useEffect, useState } from 'react';
import { getPoolsAction } from '@/actions/pool';

interface ProtocolStats {
  tvl: number;
  activePools: number;
  loading: boolean;
}

export function useProtocolStats() {
  const [stats, setStats] = useState<ProtocolStats>({
    tvl: 0,
    activePools: 0,
    loading: true
  });

  useEffect(() => {
    getPoolsAction()
      .then((result) => {
        if (result.success) {
          const tvl = result.data.reduce((acc, pool) => {
            return acc + (pool.targetCapital ?? 0);
          }, 0);
          setStats({
            tvl,
            activePools: result.data.length,
            loading: false
          });
        } else {
          setStats((s) => ({ ...s, loading: false }));
        }
      })
      .catch(() => {
        setStats((s) => ({ ...s, loading: false }));
      });
  }, []);

  return stats;
}
