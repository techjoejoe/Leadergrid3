import Link from 'next/link';
import { Mascot } from './mascot';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" prefetch={false}>
      <Mascot className="h-8 w-auto" />
    </Link>
  );
}
