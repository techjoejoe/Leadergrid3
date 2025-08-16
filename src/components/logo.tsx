import Image from 'next/image';

export function Logo() {
  return (
    <>
       <Image src="/logo.png" alt="LeaderGrid Logo" width="300" height="64" unoptimized />
    </>
  );
}
