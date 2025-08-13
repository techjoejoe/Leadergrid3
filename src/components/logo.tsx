import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/leadergrid-logo.png"
        alt="LeaderGrid Logo"
        width={160}
        height={40}
        priority
      />
    </Link>
  );
}
