import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/">
      <Image src="/LeaderGridMascotLogo.png" alt="LeaderGrid Mascot" width={40} height={40} priority />
    </Link>
  );
}
