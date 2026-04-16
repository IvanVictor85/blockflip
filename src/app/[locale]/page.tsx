import { Navbar } from '@/components/ui/navbar';
import { Hero } from '@/components/hero';
import { AssetMarketplace } from '@/components/asset-marketplace';
import { UnitEconomics } from '@/components/unit-economics';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <AssetMarketplace />
      <UnitEconomics />
      <Footer />
    </main>
  );
}
