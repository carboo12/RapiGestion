import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HandCoins } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <HandCoins className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">RapiGestion</CardTitle>
          <CardDescription>
            Ingresa tu correo para iniciar sesión en tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@ejemplo.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Iniciar Sesión
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{" "}
            <Link href="#" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
