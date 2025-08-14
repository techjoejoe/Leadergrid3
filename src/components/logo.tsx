import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" prefetch={false}>
      <BarChart3 className="h-6 w-6 text-primary" />
      <span className="font-headline text-xl font-bold text-foreground">
        LeaderGrid
      </span>
    </Link>
  );
}
