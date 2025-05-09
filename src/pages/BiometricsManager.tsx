
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fingerprint, User, Scan } from "lucide-react";
import FingerprintRegistrationDialog from "@/components/FingerprintRegistrationDialog";
import FaceRegistrationDialog from "@/components/FaceRegistrationDialog";
import { loadRegisteredFingerprints, FingerprintRegistration } from "@/utils/fingerprintUtils";
import { loadRegisteredFaces, FaceRegistration } from "@/utils/faceRecognition";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function BiometricsManager() {
  const [fingerprintDialogOpen, setFingerprintDialogOpen] = useState(false);
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [fingerprints, setFingerprints] = useState<FingerprintRegistration[]>([]);
  const [faces, setFaces] = useState<FaceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function loadBiometricData() {
      try {
        setLoading(true);
        
        // Load both biometric data types
        const [loadedFingerprints, loadedFaces] = await Promise.all([
          loadRegisteredFingerprints(),
          loadRegisteredFaces()
        ]);
        
        setFingerprints(loadedFingerprints);
        setFaces(loadedFaces);
      } catch (error) {
        console.error("Error loading biometric data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados biométricos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadBiometricData();
  }, [fingerprintDialogOpen, faceDialogOpen]);
  
  // Group fingerprints by person (CPF)
  const fingerprintsByPerson: Record<string, FingerprintRegistration[]> = {};
  
  fingerprints.forEach(fp => {
    if (!fingerprintsByPerson[fp.cpf]) {
      fingerprintsByPerson[fp.cpf] = [];
    }
    fingerprintsByPerson[fp.cpf].push(fp);
  });
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento Biométrico</h1>
          <p className="text-muted-foreground mt-2">
            Cadastre e gerencie digitais e faces para uso em assinaturas de documentos
          </p>
        </div>
        <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
      </div>
      
      <Tabs defaultValue="fingerprints" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="fingerprints" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            <span>Digitais</span>
          </TabsTrigger>
          <TabsTrigger value="faces" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Faces</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fingerprints" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Digitais Cadastradas</h2>
            <Button onClick={() => setFingerprintDialogOpen(true)}>
              <Fingerprint className="mr-2 h-4 w-4" />
              Cadastrar Digital
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(fingerprintsByPerson).length > 0 ? (
                Object.keys(fingerprintsByPerson).map(cpf => {
                  const person = fingerprintsByPerson[cpf][0];
                  const count = fingerprintsByPerson[cpf].length;
                  
                  return (
                    <Card key={cpf}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          <span>{person.name}</span>
                          <span className="text-sm font-normal text-muted-foreground">
                            {count} {count === 1 ? 'digital' : 'digitais'}
                          </span>
                        </CardTitle>
                        <CardDescription>
                          CPF: {person.cpf}<br />
                          Cargo: {person.role}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {fingerprintsByPerson[cpf].map((fp, idx) => (
                            <div key={idx} className="h-10 w-10 rounded border flex items-center justify-center bg-slate-50">
                              <Fingerprint className="h-6 w-6 text-slate-500" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="text-xs text-muted-foreground">
                          Última atualização: {new Date(person.timestamp).toLocaleString()}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-3 py-12 flex flex-col items-center justify-center text-center">
                  <Fingerprint className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma digital cadastrada</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-6">
                    Adicione digitais para usar na assinatura de documentos
                  </p>
                  <Button onClick={() => setFingerprintDialogOpen(true)}>
                    Cadastrar Digital
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="faces" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Faces Cadastradas</h2>
            <Button onClick={() => setFaceDialogOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Cadastrar Face
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {faces.length > 0 ? (
                faces.map((face, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{face.name}</CardTitle>
                      <CardDescription>
                        Cargo: {face.role}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-square w-full mb-4 flex items-center justify-center overflow-hidden rounded-md border bg-slate-50">
                        {face.image ? (
                          <img 
                            src={face.image} 
                            alt={`Face de ${face.name}`} 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <User className="h-16 w-16 text-slate-300" />
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="text-xs text-muted-foreground">
                        Cadastrada em: {new Date(face.timestamp).toLocaleString()}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 py-12 flex flex-col items-center justify-center text-center">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma face cadastrada</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-6">
                    Adicione faces para usar na assinatura de documentos
                  </p>
                  <Button onClick={() => setFaceDialogOpen(true)}>
                    Cadastrar Face
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Fingerprint registration dialog */}
      <FingerprintRegistrationDialog 
        open={fingerprintDialogOpen} 
        onOpenChange={setFingerprintDialogOpen} 
      />
      
      {/* Face registration dialog */}
      <FaceRegistrationDialog 
        open={faceDialogOpen} 
        onOpenChange={setFaceDialogOpen}
      />
    </div>
  );
}
