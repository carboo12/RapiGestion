import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-16 h-16", className)}
            aria-label="RapiGestion Logo"
        >
            <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
            <line x1="12" y1="8" x2="12" y2="16" stroke="white"></line>
            <line x1="8" y1="12" x2="16" y2="12" stroke="white"></line>
        </svg>
    )
}
