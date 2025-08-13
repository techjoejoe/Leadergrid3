import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-headline text-2xl font-bold text-primary">
      <Image src="/logo.svg" alt="LeaderGrid Logo" width={140} height={30} priority />
    </Link>
  );
}
