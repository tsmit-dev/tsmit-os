"use client";

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { LogIn, Wrench } from 'lucide-react';

export default function LoginPage() {
  const { setRole } = useAuth();
  const router = useRouter();

  const handleLogin = (role: UserRole) => {
    if (!role) return;
    setRole(role);
    router.push('/dashboard');
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
             <Wrench className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">TSMIT</CardTitle>
          <CardDescription>Sistema de Controle de Ordens de Serviço</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <h3 className="text-center text-sm text-muted-foreground pt-4">Selecione um perfil para entrar</h3>
            <Button size="lg" onClick={() => handleLogin('suporte')}>
              <LogIn className="mr-2" /> Entrar como Suporte
            </Button>
            <Button size="lg" onClick={() => handleLogin('laboratorio')} variant="secondary">
              <LogIn className="mr-2" /> Entrar como Laboratório
            </Button>
            <Button size="lg" onClick={() => handleLogin('admin')} variant="outline">
              <LogIn className="mr-2" /> Entrar como Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
