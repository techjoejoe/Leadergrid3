import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-headline text-2xl font-bold text-primary">
      <Image src="/LeaderGridMascot.png" alt="LeaderGrid Mascot" width={30} height={30} priority />
      <span>LeaderGrid</span>
    </Link>
  );
}
