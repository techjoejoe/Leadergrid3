import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center font-headline text-2xl font-bold text-primary">
      <Image src="/LeaderGridMascot.png" alt="LeaderGrid Mascot" width={40} height={40} priority />
    </Link>
  );
}
