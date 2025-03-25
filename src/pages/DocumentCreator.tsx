
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft, Save, Printer, Download, Upload, PaintBucket } from "lucide-react";
import { FormBox, FormField, DocumentType, UserDocument } from "@/entities/all";
import { saveFormData } from "@/utils/formUtils";
import { generatePDF } from "@/utils/pdfUtils";
import { SketchPicker } from "react-color";

export default function DocumentCreator() {
  const { docType } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState([]);
  const [fields, setFields] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [documentTitle, setDocumentTitle] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [currentColorTarget, setCurrentColorTarget] = useState({ type: "", id: "" });
  const [customColors, setCustomColors] = useState({
    header: "#f97316", // orange-500
    sectionHeader: "#f97316",
    background: "#ffffff",
    text: "#000000"
  });
  const [logoImage, setLogoImage] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [boxesData, fieldsData, typesData] = await Promise.all([
          FormBox.list("order"),
          FormField.list("order"),
          DocumentType.list()
        ]);
        
        setBoxes(boxesData);
        setFields(fieldsData);
        setDocumentTypes(typesData);
        
        // If docType is provided, filter boxes and fields
        if (docType) {
          const foundType = typesData.find(type => type.id === docType || type.slug === docType);
          if (foundType) {
            setDocumentTitle(foundType.name || "Novo Documento");
            if (foundType.colors) {
              setCustomColors(foundType.colors);
            }
            if (foundType.logo) {
              setLogoImage(foundType.logo);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar o formulário",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [docType, toast]);

  const handleInputChange = (fieldId, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSaveDocument = async (saveAs = false) => {
    if (!documentTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, informe um título para o documento",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const documentData = {
        title: documentTitle,
        docType: docType,
        values: formValues,
        colors: customColors,
        logo: logoImage,
        date: new Date().toISOString()
      };
      
      // Save to localStorage using the utility function
      const success = saveFormData(docType || "custom", documentTitle, documentData);
      
      if (success) {
        toast({
          title: "Documento salvo",
          description: "O documento foi salvo com sucesso"
        });
        
        if (!saveAs) {
          // Navigate back after saving
          navigate(-1);
        } else {
          setSaveDialogOpen(false);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o documento",
        variant: "destructive"
      });
    }
  };

  const handlePrint = useReactToPrint({
    content: () => formRef.current,
    documentTitle: documentTitle,
    onAfterPrint: () => {
      toast({
        title: "Documento impresso",
        description: "O documento foi enviado para impressão"
      });
    }
  });

  const handleExportPDF = async () => {
    const success = await generatePDF(formRef.current, documentTitle);
    
    if (success) {
      toast({
        title: "PDF gerado",
        description: "O documento foi exportado para PDF com sucesso"
      });
    } else {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo PDF",
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openColorPicker = (type, id = "") => {
    setCurrentColorTarget({ type, id });
    setColorPickerOpen(true);
  };

  const handleColorChange = (color) => {
    const { hex } = color;
    
    if (currentColorTarget.type === "header") {
      setCustomColors(prev => ({ ...prev, header: hex }));
    } else if (currentColorTarget.type === "sectionHeader") {
      setCustomColors(prev => ({ ...prev, sectionHeader: hex }));
    } else if (currentColorTarget.type === "background") {
      setCustomColors(prev => ({ ...prev, background: hex }));
    } else if (currentColorTarget.type === "text") {
      setCustomColors(prev => ({ ...prev, text: hex }));
    }
  };

  // Helper function to render different field types
  const renderField = (field) => {
    switch (field.type) {
      case "short_text":
        return (
          <Input
            id={field.id}
            value={formValues[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.label}
            className="w-full"
          />
        );
      case "long_text":
        return (
          <textarea
            id={field.id}
            value={formValues[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.label}
            className="w-full min-h-[100px] p-2 border rounded"
          />
        );
      case "checkbox":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.id}
              checked={formValues[field.id] || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="mr-2"
            />
            <label htmlFor={field.id}>{field.label}</label>
          </div>
        );
      case "flag":
        return (
          <div className="space-y-2">
            {(field.options || []).map((option, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="radio"
                  id={`${field.id}-${idx}`}
                  name={field.id}
                  checked={formValues[field.id] === option.text}
                  onChange={() => handleInputChange(field.id, option.text)}
                  className="mr-2"
                />
                <label htmlFor={`${field.id}-${idx}`}>{option.text}</label>
              </div>
            ))}
          </div>
        );
      case "flag_with_text":
        return (
          <div className="space-y-3">
            {(field.options || []).map((option, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${field.id}-${idx}`}
                    checked={formValues[`${field.id}-${idx}-checked`] || false}
                    onChange={(e) => handleInputChange(`${field.id}-${idx}-checked`, e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor={`${field.id}-${idx}`}>{option.text}</label>
                </div>
                <Input
                  id={`${field.id}-${idx}-text`}
                  value={formValues[`${field.id}-${idx}-text`] || ""}
                  onChange={(e) => handleInputChange(`${field.id}-${idx}-text`, e.target.value)}
                  placeholder="Adicionar informação"
                  className="w-full ml-6"
                />
              </div>
            ))}
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            id={field.id}
            value={formValues[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full"
          />
        );
      case "time":
        return (
          <Input
            type="time"
            id={field.id}
            value={formValues[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full"
          />
        );
      case "signature":
        return (
          <div className="space-y-2">
            <div className="border-2 border-dashed rounded p-4 text-center min-h-[100px] flex items-center justify-center">
              {formValues[field.id] ? (
                <img src={formValues[field.id]} alt="Assinatura" className="max-h-[100px]" />
              ) : (
                <span className="text-gray-500">Área para Assinatura</span>
              )}
            </div>
            <Input
              id={`${field.id}-name`}
              value={formValues[`${field.id}-name`] || ""}
              onChange={(e) => handleInputChange(`${field.id}-name`, e.target.value)}
              placeholder={field.signature_label || "Nome/Cargo"}
              className="text-center"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                // Placeholder for signature capture
                const signatureData = prompt("Digite seu nome para simular uma assinatura");
                if (signatureData) {
                  handleInputChange(field.id, "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text x="10" y="30" font-family="cursive" font-size="24" fill="black">${signatureData}</text></svg>`));
                }
              }}
            >
              Assinar
            </Button>
          </div>
        );
      case "image":
        return (
          <div className="space-y-2">
            <div className="border-2 border-dashed rounded p-4 text-center min-h-[150px] flex items-center justify-center">
              {formValues[field.id] ? (
                <img src={formValues[field.id]} alt="Imagem enviada" className="max-h-[150px]" />
              ) : (
                <span className="text-gray-500">Área para Upload de Imagem</span>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              id={field.id}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    handleInputChange(field.id, reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full"
            />
          </div>
        );
      default:
        return <p>Tipo de campo não suportado: {field.type}</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Criar Documento</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Preencha os campos do documento e salve ou exporte
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSaveDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Como
            </Button>
            <Button
              onClick={() => handleSaveDocument(false)}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Customization Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentTitle" className="mb-2 block">Título do Documento</Label>
                <Input
                  id="documentTitle"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Insira o título do documento"
                  className="w-full"
                />
              </div>
              <div>
                <Label className="mb-2 block">Logo da Empresa</Label>
                <div className="flex items-center gap-2">
                  {logoImage && (
                    <div className="h-10 w-20 relative overflow-hidden rounded border">
                      <img src={logoImage} alt="Logo" className="object-contain h-full w-full" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2 block">Cor do Cabeçalho</Label>
                <Button
                  variant="outline"
                  onClick={() => openColorPicker("header")}
                  className="w-full"
                >
                  <div 
                    className="h-4 w-4 mr-2 rounded-full" 
                    style={{ backgroundColor: customColors.header }}
                  />
                  Selecionar
                </Button>
              </div>
              <div>
                <Label className="mb-2 block">Cor das Seções</Label>
                <Button
                  variant="outline"
                  onClick={() => openColorPicker("sectionHeader")}
                  className="w-full"
                >
                  <div 
                    className="h-4 w-4 mr-2 rounded-full" 
                    style={{ backgroundColor: customColors.sectionHeader }}
                  />
                  Selecionar
                </Button>
              </div>
              <div>
                <Label className="mb-2 block">Cor de Fundo</Label>
                <Button
                  variant="outline"
                  onClick={() => openColorPicker("background")}
                  className="w-full"
                >
                  <div 
                    className="h-4 w-4 mr-2 rounded-full" 
                    style={{ backgroundColor: customColors.background }}
                  />
                  Selecionar
                </Button>
              </div>
              <div>
                <Label className="mb-2 block">Cor do Texto</Label>
                <Button
                  variant="outline"
                  onClick={() => openColorPicker("text")}
                  className="w-full"
                >
                  <div 
                    className="h-4 w-4 mr-2 rounded-full" 
                    style={{ backgroundColor: customColors.text }}
                  />
                  Selecionar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Form */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Carregando formulário...</p>
          </div>
        ) : (
          <div 
            ref={formRef}
            style={{ 
              backgroundColor: customColors.background,
              color: customColors.text
            }}
            className="border rounded-md shadow-sm animate-fade-in mb-10"
          >
            {/* Form Header */}
            <div 
              className="flex justify-between items-center p-4"
              style={{ backgroundColor: customColors.header, color: "#ffffff" }}
            >
              <div className="flex items-center">
                {logoImage ? (
                  <img src={logoImage} alt="Logo" className="h-10 mr-4" />
                ) : (
                  <div className="w-10 h-10 bg-white/20 rounded mr-4"></div>
                )}
                <h1 className="text-xl uppercase font-bold">{documentTitle}</h1>
              </div>
              <div className="flex gap-4">
                <div className="border border-white p-1 px-2">
                  <span>REV. 1</span>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-4">
              {boxes.length === 0 ? (
                <p className="text-center text-gray-500 p-10">
                  Nenhuma seção encontrada para este tipo de documento
                </p>
              ) : (
                boxes.map((box, boxIndex) => (
                  <div key={box.id} className="mb-6">
                    {/* Section Header */}
                    <div 
                      className="p-2 font-bold mb-2"
                      style={{ backgroundColor: customColors.sectionHeader, color: "#ffffff" }}
                    >
                      <h2 className="text-md">{boxIndex + 1}. {box.title}</h2>
                    </div>
                    
                    {/* Section Fields */}
                    <div className="space-y-4 p-2">
                      {fields
                        .filter(f => f.box_id === box.id)
                        .map(field => (
                          <div key={field.id} className="border-b border-gray-200 pb-4">
                            <Label htmlFor={field.id} className="font-medium block mb-2">
                              {field.label}
                            </Label>
                            {renderField(field)}
                          </div>
                        ))
                      }
                      
                      {fields.filter(f => f.box_id === box.id).length === 0 && (
                        <p className="text-center text-gray-500 py-4">
                          Nenhum campo adicionado nesta seção
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Color Picker Dialog */}
      <Dialog open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Cor</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <SketchPicker
              color={
                currentColorTarget.type === "header" ? customColors.header :
                currentColorTarget.type === "sectionHeader" ? customColors.sectionHeader :
                currentColorTarget.type === "background" ? customColors.background :
                customColors.text
              }
              onChange={handleColorChange}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setColorPickerOpen(false)}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save As Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Documento Como</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="saveAsTitle" className="block mb-2">Título do Documento</Label>
              <Input
                id="saveAsTitle"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Insira o título do documento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleSaveDocument(true)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
