import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" prefetch={false}>
      <Image 
        src="/logo.png" 
        alt="LeaderGrid Mascot" 
        width={140} 
        height={32}
        priority
      />
    </Link>
  );
}
