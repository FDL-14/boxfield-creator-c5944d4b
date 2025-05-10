
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, LogIn, KeyRound, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [session, setSession] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Check for verification action from URL
  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (type === 'signup' && token) {
        setLoading(true);
        
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        });
        
        setLoading(false);
        
        if (error) {
          setErrorMessage('Erro ao verificar o e-mail: ' + error.message);
        } else {
          setSuccessMessage('E-mail verificado com sucesso! Agora você pode fazer login.');
        }
      }
    };
    
    verifyToken();
  }, [searchParams]);
  
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            cpf: cpf
          }
        }
      });
      
      if (error) throw error;
      
      setSuccessMessage(
        "Cadastro realizado! Verifique seu e-mail para confirmar sua conta."
      );
      
    } catch (error: any) {
      if (error.message.includes('Email not confirmed')) {
        setErrorMessage("E-mail ainda não confirmado. Verifique sua caixa de entrada para ativar sua conta.");
      } else {
        setErrorMessage(error.message || "Ocorreu um erro durante o cadastro");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs("signin")) return;
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error("E-mail ainda não confirmado. Verifique sua caixa de entrada para ativar sua conta.");
        }
        throw error;
      }
      
    } catch (error: any) {
      setErrorMessage(error.message || "Credenciais inválidas");
      setLoading(false);
    }
  };
  
  const resendConfirmationEmail = async () => {
    if (!email) {
      setErrorMessage("Informe seu e-mail para reenviar o link de confirmação");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) throw error;
      
      setSuccessMessage("E-mail de confirmação reenviado. Verifique sua caixa de entrada.");
      
    } catch (error: any) {
      setErrorMessage(error.message || "Ocorreu um erro ao reenviar o e-mail de confirmação");
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Por favor, informe seu e-mail para receber o link de redefinição");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth?reset=true',
      });
      
      if (error) throw error;
      
      setSuccessMessage("E-mail enviado. Verifique sua caixa de entrada para redefinir sua senha");
      
    } catch (error: any) {
      setErrorMessage(error.message || "Não foi possível enviar o e-mail de redefinição");
    } finally {
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
      
      if (!cpf) {
        setErrorMessage("Por favor, informe seu CPF");
        return false;
      }
    }
    
    if (!email) {
      setErrorMessage("Por favor, informe seu e-mail");
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
          
          {errorMessage?.includes('não confirmado') && (
            <div className="mb-4 flex justify-center">
              <Button 
                variant="outline" 
                onClick={resendConfirmationEmail}
                disabled={loading}
                className="text-xs"
              >
                Reenviar e-mail de confirmação
              </Button>
            </div>
          )}
          
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">E-mail</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-login">Senha</Label>
                    <Button 
                      variant="link" 
                      type="button"
                      className="text-xs p-0 h-auto"
                      onClick={handleResetPassword}
                    >
                      Esqueceu a senha?
                    </Button>
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
          <p className="text-xs text-center text-amber-600">
            É necessário confirmar seu e-mail após o cadastro para poder acessar o sistema.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
