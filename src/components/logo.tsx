import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            className={cn("w-16 h-16", className)}
            aria-label="RapiCredi Logo"
        >
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#00AEEF', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#0072B5', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#8DC63F', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#39B54A', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            
            <circle cx="100" cy="90" r="60" fill="rgba(225, 245, 254, 0.8)" />

            <g transform="translate(0 -10)">
                <rect x="70" y="80" width="15" height="50" fill="url(#grad1)" rx="3" transform="skewX(-5)" />
                <rect x="95" y="60" width="15" height="70" fill="url(#grad1)" rx="3" transform="skewX(-5)" />
                <rect x="120" y="40" width="15" height="90" fill="url(#grad1)" rx="3" transform="skewX(-5)" />
            </g>

            <path
                d="M 50 115 C 70 95, 90 95, 110 105 L 120 110 L 145 95 L 155 90 L 160 95 L 150 100 L 125 115 L 115 120 C 95 130, 75 130, 55 120 Z"
                fill="url(#grad2)"
                stroke="#ffffff"
                strokeWidth="2"
            >
                 <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; 0 -2; 0 0"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </path>
            
            <text x="63" y="107" fontFamily="Arial, sans-serif" fontSize="10" fill="white" fontWeight="bold">$</text>
            <text x="88" y="100" fontFamily="Arial, sans-serif" fontSize="10" fill="white" fontWeight="bold">€</text>
            <text x="142" y="87" fontFamily="Arial, sans-serif" fontSize="10" fill="white" fontWeight="bold">£</text>
            <path d="M 140 95 L 150 85 L 140 85 Z" fill="white" />


            <text x="35" y="170" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#0072B5">RapiCredi</text>
            <text x="50" y="190" fontFamily="Arial, sans-serif" fontSize="12" fill="#00AEEF">Dinero rápido y seguro</text>
        </svg>
    )
}
