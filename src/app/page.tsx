// Root page — unreachable in practice.
// The next-intl middleware rewrites / → [locale]/page.tsx before routing.
import { notFound } from 'next/navigation';

export default function RootPage() {
  notFound();
}
