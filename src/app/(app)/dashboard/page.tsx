'use client';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import packageJson from "../../../../package.json";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Landmark } from "lucide-react";

const CustomLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <circle cx="50" cy="50" r="42" fill="url(#grad1)" />
      <path d="M 30 70 L 30 50 L 40 50 L 40 70 Z" fill="hsl(var(--primary))" />
      <path d="M 45 70 L 45 40 L 55 40 L 55 70 Z" fill="hsl(var(--primary))" />
      <path d="M 60 70 L 60 30 L 70 30 L 70 70 Z" fill="hsl(var(--primary))" />
      <path d="M30 50 C 40 40, 60 40, 70 50 L 75 45 C 80 40, 70 20, 80 25 L 85 20" stroke="hsl(var(--accent))" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: "lightblue", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
  </svg>
);


const NoCobradosIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M6 18h2c.9 0 1.8-.4 2.4-1" />
    <path d="M19.4 17c.4-.6.6-1.2.6-1.9v-2.1c0-1-.8-1.9-1.8-1.9H16" />
    <path d="M16 12h2a2 2 0 0 1 2 2v2" />
    <path d="M22 18h-2" />
  </svg>
);


export default function DashboardPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  
  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserName(userDocSnap.data().name.toUpperCase());
        } else {
          setUserName(user.email?.split('@')[0].toUpperCase() || 'Usuario');
        }
      } else {
        setUserName(null);
      }
    });

    const timer = setInterval(() => {
      setCurrentDate(format(new Date(), "PPPPp", { locale: es }));
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex-1 space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-primary">Recuperacion</h2>
        <span className="text-sm text-primary">v {packageJson.version}</span>
      </div>
      
      <Card className="border-primary border-2 rounded-2xl shadow-lg">
        <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
          <CustomLogo className="w-20 h-20 text-primary" />
          <h3 className="text-2xl font-bold text-primary">{userName || 'Cargando...'}</h3>
          <p className="text-muted-foreground">Que tengas un buen día!</p>
          <p className="text-sm text-muted-foreground">{currentDate || 'Cargando fecha...'}</p>
          <h4 className="text-xl font-semibold text-blue-800">Recuperación</h4>
          <p className="text-3xl font-bold text-blue-800">C$ 11,595.00</p>
          <Separator className="w-full" />
          <p className="text-lg font-semibold">Total de cobros: 15</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/cobrados" className="block">
          <Card className="border-primary border-2 rounded-2xl hover:bg-accent transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-4 space-y-2 text-center">
              <Landmark className="w-12 h-12 text-primary" />
              <p className="font-semibold text-primary">Cobrados</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/no-cobrados" className="block">
          <Card className="border-destructive border-2 rounded-2xl hover:bg-accent transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-4 space-y-2 text-center">
              <NoCobradosIcon className="w-12 h-12 text-destructive" />
              <p className="font-semibold text-destructive">No Cobrados</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
