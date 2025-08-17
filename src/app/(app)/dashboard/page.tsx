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
import Image from "next/image";

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
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v7l4 2" />
    <path d="m15 19-3-3-3 3" />
  </svg>
);


export default function DashboardPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [dailyRecovery, setDailyRecovery] = useState(0);
  const [dailyPaymentsCount, setDailyPaymentsCount] = useState(0);
  
  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    // TODO: fetch daily recovery and payments count from firestore

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
          <Image src="https://placehold.co/100x100.png" alt="Company Logo" width={80} height={80} className="w-20 h-20 text-primary" data-ai-hint="logo" />
          <h3 className="text-2xl font-bold text-primary">{userName || 'Cargando...'}</h3>
          <p className="text-muted-foreground">Que tengas un buen día!</p>
          <p className="text-sm text-muted-foreground">{currentDate || 'Cargando fecha...'}</p>
          <h4 className="text-xl font-semibold text-blue-800">Recuperación</h4>
          <p className="text-3xl font-bold text-blue-800">C$ {dailyRecovery.toFixed(2)}</p>
          <Separator className="w-full" />
          <p className="text-lg font-semibold">Total de cobros: {dailyPaymentsCount}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/dashboard/cobrados" className="block h-full">
          <Card className="border-primary border-2 rounded-2xl hover:bg-accent transition-colors h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 space-y-2 text-center h-full">
              <Landmark className="w-12 h-12 text-primary" />
              <p className="font-semibold text-primary">Cobrados</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/no-cobrados" className="block h-full">
          <Card className="border-destructive border-2 rounded-2xl hover:bg-accent transition-colors h-full">
            <CardContent className="flex flex-col items-center justify-center p-4 space-y-2 text-center h-full">
              <NoCobradosIcon className="w-12 h-12 text-destructive" />
              <p className="font-semibold text-destructive">No Cobrados</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
