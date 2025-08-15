import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" prefetch={false}>
       <Image src="/logo.png" alt="LeaderGrid Logo" width="150" height="32" />
    </Link>
  );
}
