import Image from 'next/image';
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <Image
            src="/logo.svg"
            alt="RapiGestion Logo"
            width={64}
            height={64}
            className={cn("w-16 h-16", className)}
            priority
        />
    )
}
