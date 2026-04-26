import { Hero } from '@/components/hero';
import { AssetMarketplace } from '@/components/asset-marketplace';
import { UnitEconomics } from '@/components/unit-economics';
import { BuildCycle } from '@/components/build-cycle';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <AssetMarketplace />
      <UnitEconomics />
      <BuildCycle />
      <Footer />
    </main>
  );
}
