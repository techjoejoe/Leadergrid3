import Image from 'next/image';

export function Logo() {
  return (
    <>
       <Image src="/logo.png" alt="LeaderGrid Logo" width="150" height="32" unoptimized />
    </>
  );
}
