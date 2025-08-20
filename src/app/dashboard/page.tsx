
'use client';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, getFirestore, collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import packageJson from "../../../package.json";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { Logo } from "@/components/logo";

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [dailyRecovery, setDailyRecovery] = useState(0);
  const [dailyPaymentsCount, setDailyPaymentsCount] = useState(0);
  
  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserName(userData.name.toUpperCase());
          setUserRole(userData.role);
        } else {
          setUserName(user.email?.split('@')[0].toUpperCase() || 'Usuario');
          setUserRole(null); // Role is unknown
        }
      } else {
        setUserName(null);
        setUserRole(null);
      }
    });

    const timer = setInterval(() => {
      setCurrentDate(format(new Date(), "PPPPp", { locale: es }));
    }, 1000);

    return () => {
      unsubscribeAuth();
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const db = getFirestore(app);
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    
    if (!currentUser) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const paymentsQuery = query(
      collection(db, "payments"),
      where("gestorId", "==", currentUser.uid)
    );

    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      let totalAmount = 0;
      let paymentCount = 0;
      snapshot.forEach((doc) => {
        const payment = doc.data();
        const paymentDate = payment.paymentDate.toDate();
        if (paymentDate >= todayStart && paymentDate <= todayEnd) {
            totalAmount += payment.amount;
            paymentCount++;
        }
      });
      setDailyRecovery(totalAmount);
      setDailyPaymentsCount(paymentCount);
    }, (error) => {
      console.error("Error fetching daily payments:", error);
    });

    return () => {
      if (unsubscribePayments) unsubscribePayments();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between space-y-2 flex-shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-primary">Recuperacion</h2>
        <span className="text-sm text-primary">v {packageJson.version}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pt-4 pb-16">
        <Card className="border-primary border-2 rounded-2xl shadow-lg">
          <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
          <Logo className="w-24 h-24" />
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
    </div>
  )
}
