import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" prefetch={false}>
      <Image 
        src="https://placehold.co/32x32.png" 
        alt="LeaderGrid Mascot" 
        width={32} 
        height={32}
        data-ai-hint="mascot character"
      />
      <span className="font-headline text-xl font-bold text-foreground">
        LeaderGrid
      </span>
    </Link>
  );
}
