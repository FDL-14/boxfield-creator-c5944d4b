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
import { 
  ArrowLeft, 
  Save, 
  Printer, 
  Download, 
  Upload, 
  PaintBucket, 
  FileSpreadsheet, 
  FileText,
  Copy,
  Trash2,
  XCircle 
} from "lucide-react";
import { FormBox, FormField, DocumentType, UserDocument } from "@/entities/all";
import { saveFormData } from "@/utils/formUtils";
import { generatePDF } from "@/utils/pdfUtils";
import { SketchPicker } from "react-color";
import DrawSignature from "@/components/DrawSignature";
import CancelDocumentDialog from "@/components/CancelDocumentDialog";
import BiometricSignature from "@/components/BiometricSignature";
import { exportToExcel, exportToWord } from "@/utils/exportUtils";
import { getLocationData } from "@/utils/geoUtils";

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
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancelInfo, setCancelInfo] = useState(null);
  const [biometricDialogOpen, setBiometricDialogOpen] = useState(false);
  const [signatureType, setSignatureType] = useState("draw"); // "draw", "face", "fingerprint"
  const [documentMetadata, setDocumentMetadata] = useState({
    created: new Date().toISOString(),
    location: { latitude: 0, longitude: 0, formatted: "Localização não disponível" }
  });
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

        try {
          const locationData = await getLocationData();
          setDocumentMetadata(prevState => ({
            ...prevState,
            location: {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              formatted: locationData.formatted
            }
          }));
        } catch (error) {
          console.error("Error getting location:", error);
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
      const timestamp = new Date().toISOString();
      let locationData = documentMetadata.location;
      
      try {
        const newLocationData = await getLocationData();
        locationData = {
          latitude: newLocationData.latitude,
          longitude: newLocationData.longitude,
          formatted: newLocationData.formatted
        };
      } catch (error) {
        console.error("Error updating location before save:", error);
      }
      
      const documentData = {
        title: documentTitle,
        docType: docType,
        values: formValues,
        colors: customColors,
        logo: logoImage,
        createdAt: timestamp,
        location: locationData,
        cancelled: isCancelled,
        cancelInfo: cancelInfo,
        date: timestamp
      };
      
      const success = saveFormData(docType || "custom", documentTitle, documentData);
      
      if (success) {
        toast({
          title: "Documento salvo",
          description: "O documento foi salvo com sucesso"
        });
        
        if (!saveAs) {
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
    documentTitle: documentTitle,
    content: () => formRef.current,
    onAfterPrint: () => {
      toast({
        title: "Documento impresso",
        description: "O documento foi enviado para impressão"
      });
    },
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

  const handleExportExcel = async () => {
    const exportData = {
      Título: documentTitle,
      'Data de Criação': new Date(documentMetadata.created).toLocaleString(),
      'Localização': documentMetadata.location.formatted,
      ...formValues
    };
    
    const success = exportToExcel(exportData, documentTitle);
    
    if (success) {
      toast({
        title: "Excel gerado",
        description: "O documento foi exportado para Excel com sucesso"
      });
    } else {
      toast({
        title: "Erro ao gerar Excel",
        description: "Não foi possível gerar o arquivo Excel",
        variant: "destructive"
      });
    }
  };

  const handleExportWord = async () => {
    if (!formRef.current) return;
    
    const success = await exportToWord(formRef.current, documentTitle);
    
    if (success) {
      toast({
        title: "Word gerado",
        description: "O documento foi exportado para Word com sucesso"
      });
    } else {
      toast({
        title: "Erro ao gerar Word",
        description: "Não foi possível gerar o arquivo Word",
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

  const openSignatureDialog = (fieldId, type = "draw") => {
    setCurrentSignatureField(fieldId);
    setSignatureType(type);
    if (type === "draw") {
      setSignatureDialogOpen(true);
    } else if (type === "face" || type === "fingerprint") {
      setBiometricDialogOpen(true);
    }
  };

  const handleSignatureSave = (signatureData) => {
    if (currentSignatureField) {
      handleInputChange(currentSignatureField, signatureData);
      setSignatureDialogOpen(false);
    }
  };

  const handleBiometricCapture = (type, data) => {
    if (currentSignatureField) {
      handleInputChange(currentSignatureField, data);
      setBiometricDialogOpen(false);
    }
  };

  const handleCancelDocument = (reason, approvers) => {
    setIsCancelled(true);
    setCancelInfo({
      reason,
      approvers,
      timestamp: new Date().toISOString()
    });
    
    toast({
      title: "Documento cancelado",
      description: "O documento foi marcado como cancelado"
    });
  };

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
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => openSignatureDialog(field.id, "draw")}
              >
                Assinar na Tela
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => openSignatureDialog(field.id, "face")}
              >
                Facial
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => openSignatureDialog(field.id, "fingerprint")}
              >
                Digital
              </Button>
            </div>
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
              type="button"
              onClick={() => handlePrint()}
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
            <Button
              onClick={handleExportExcel}
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              onClick={handleExportWord}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Word
            </Button>
            {!isCancelled && (
              <Button
                onClick={() => setCancelDialogOpen(true)}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Documento
              </Button>
            )}
          </div>
        </div>

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
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <Label className="mb-1 block text-xs text-gray-500">Data e Hora de Criação</Label>
                <div className="text-sm">
                  {new Date(documentMetadata.created).toLocaleString()}
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs text-gray-500">Localização Geográfica</Label>
                <div className="text-sm">
                  {documentMetadata.location.formatted}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {

