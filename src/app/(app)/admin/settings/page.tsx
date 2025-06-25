"use client";

import { useAuth } from "@/components/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { EmailSettingsForm } from "@/components/email-settings-form";

export default function AdminSettingsPage() {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role && role !== "admin") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (role !== "admin") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Configurações do Sistema</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de E-mail</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailSettingsForm />
          </CardContent>
        </Card>

        {/* Adicione outras seções de configuração aqui no futuro, se necessário */}
      </div>
    </div>
  );
}
