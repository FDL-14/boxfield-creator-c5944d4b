
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase, cleanCPF } from "@/integrations/supabase/client";
import { Loader2, UserPlus, LogIn, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [session, setSession] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Check for existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) navigate('/');
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) navigate('/');
      }
    );
    
    return () => subscription.unsubscribe();
  }, [navigate]);
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs("signup")) return;
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // Clean the CPF to remove any non-digits
      const cleanedCpf = cleanCPF(cpf);
      
      // Use admin API via edge function to create user
      const response = await fetch(
        "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/create-user-with-cpf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cpf: cleanedCpf,
            password,
            name,
            email
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Ocorreu um erro durante o cadastro");
      }
      
      setSuccessMessage(
        "Cadastro realizado com sucesso! Agora você pode fazer login."
      );
      
      // Auto-login the user
      await handleSignIn(null, cleanedCpf, password);
      
    } catch (error: any) {
      setErrorMessage(error.message || "Ocorreu um erro durante o cadastro");
      setLoading(false);
    }
  };
  
  const handleSignIn = async (e: React.FormEvent | null, overrideCpf?: string, overridePassword?: string) => {
    if (e) e.preventDefault();
    
    if (!e && (!overrideCpf || !overridePassword)) {
      return;
    }
    
    if (e && !validateInputs("signin")) {
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // Use the provided CPF and password or the state values
      const cleanedCpf = overrideCpf || cleanCPF(cpf);
      const passwordToUse = overridePassword || password;
      
      // Use the edge function to login with CPF
      const response = await fetch(
        "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/login-with-cpf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cpf: cleanedCpf,
            password: passwordToUse
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Credenciais inválidas");
      }
      
      // Handle the session token returned by the edge function
      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token
        });
        
        navigate("/");
      } else {
        throw new Error("Falha ao obter sessão de autenticação");
      }
      
    } catch (error: any) {
      setErrorMessage(error.message || "Credenciais inválidas");
      setLoading(false);
    }
  };
  
  const validateInputs = (type: "signin" | "signup") => {
    setErrorMessage(null);
    
    if (type === "signup") {
      if (!name) {
        setErrorMessage("Por favor, informe seu nome completo");
        return false;
      }
      
      if (!email) {
        setErrorMessage("Por favor, informe seu e-mail");
        return false;
      }
    }
    
    if (!cpf) {
      setErrorMessage("Por favor, informe seu CPF");
      return false;
    }
    
    if (!password) {
      setErrorMessage("Por favor, informe sua senha");
      return false;
    }
    
    return true;
  };
  
  const formatCPF = (value: string) => {
    // Remove non-digits
    let cleaned = value.replace(/\D/g, '');
    
    // Limit to 11 digits
    cleaned = cleaned.slice(0, 11);
    
    // Format as CPF: 000.000.000-00
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    } else if (cleaned.length <= 9) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
  };
  
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };
  
  // Create master user function
  const createMasterUser = async () => {
    try {
      // Call the init-master-user edge function
      const response = await fetch(
        "https://tsjdsbxgottssqqlzfxl.functions.supabase.co/init-master-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
        }
      );
      
      const result = await response.json();
      console.log("Master user initialization result:", result);
      
    } catch (error) {
      console.error("Error initializing master user:", error);
    }
  };
  
  // Attempt to create master user on component mount
  useEffect(() => {
    createMasterUser();
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sistema de Documentação</CardTitle>
          <CardDescription className="text-center">
            Acesse ou crie sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {successMessage && (
            <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn as any} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf-login">CPF</Label>
                  <Input
                    id="cpf-login"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCPFChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-login">Senha</Label>
                  </div>
                  <Input
                    id="password-login"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="João da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCPFChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    O e-mail será usado apenas para contato.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter no mínimo 6 caracteres
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col justify-center">
          <p className="text-xs text-center text-muted-foreground mb-2">
            Ao entrar você concorda com nossos termos e política de privacidade.
          </p>
          <p className="text-xs text-center">
            Entre em contato com o administrador caso não consiga acessar o sistema.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
