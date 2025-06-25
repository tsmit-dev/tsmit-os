"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription, // <-- Adicionado aqui
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const formSchema = z.object({
  emailService: z.string().optional(), // e.g., SendGrid, Mailgun, SMTP
  apiKey: z.string().optional(),
  senderEmail: z.string().email("E-mail do remetente inválido.").optional(),
  // Add more fields as needed for specific email services, e.g., SMTP host, port, user, pass
});

export function EmailSettingsForm() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailService: "",
      apiKey: "",
      senderEmail: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      // Here you would typically save these settings to a secure backend or Firebase Remote Config
      // For now, we'll just simulate success.
      console.log("Saving email settings:", values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Sucesso",
        description: "Configurações de e-mail salvas (simulado).",
      });
    } catch (error) {
      console.error("Failed to save email settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de e-mail.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="emailService"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço de E-mail (Ex: SendGrid)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="SendGrid, Nodemailer, etc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key / Chave de Acesso</FormLabel>
              <FormControl>
                <Input type="password" {...field} placeholder="sk-..." />
              </FormControl>
              <FormDescription>
                Em um ambiente de produção, esta chave deve ser armazenada de forma segura (ex: variáveis de ambiente).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="senderEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail do Remetente</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="contato@suaempresa.com.br" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </Form>
  );
}
