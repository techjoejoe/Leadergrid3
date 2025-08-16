import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
}

export function Logo({ width = 150, height = 32 }: LogoProps) {
  return (
    <>
       <Image src="/logo.png" alt="LeaderGrid Logo" width={width} height={height} unoptimized />
    </>
  );
}
