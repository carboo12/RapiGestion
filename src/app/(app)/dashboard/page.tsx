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
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill="currentColor"
  >
    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM169.8 202.6c-25.2 0-45.7 20.5-45.7 45.7s20.5 45.7 45.7 45.7s45.7-20.5 45.7-45.7s-20.5-45.7-45.7-45.7zM342.2 202.6c-25.2 0-45.7 20.5-45.7 45.7s20.5 45.7 45.7 45.7s45.7-20.5 45.7-45.7s-20.5-45.7-45.7-45.7zM256 395.4c-70.1 0-131.2-44.1-158.4-107.9C121.2 232.5 182.2 192 256 192s134.8 40.5 158.4 105.5c-27.2 63.8-88.3 107.9-158.4 107.9z" />
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
          <CustomLogo className="w-20 h-20 text-blue-800" />
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
        <Card className="border-destructive border-2 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center p-4 space-y-2 text-center">
            <NoCobradosIcon className="w-12 h-12 text-destructive" />
            <p className="font-semibold text-destructive">No Cobrados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
