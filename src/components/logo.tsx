'use client';
import Image from 'next/image';

export function Logo({className}: {className?: string}) {
  return (
    <Image
      src="/logo1.svg"
      alt="RapiGestion Logo"
      width={100}
      height={100}
      className={className}
      priority
    />
  );
}
