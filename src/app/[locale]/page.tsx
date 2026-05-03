import { Hero } from '@/components/hero';
import { AssetMarketplace } from '@/components/asset-marketplace';
import { UnitEconomics } from '@/components/unit-economics';
import { SkinInTheGame } from '@/components/skin-in-the-game';
import { BuildCycle } from '@/components/build-cycle';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <AssetMarketplace />
      <UnitEconomics />
      <SkinInTheGame />
      <BuildCycle />
      <Footer />
    </main>
  );
}
