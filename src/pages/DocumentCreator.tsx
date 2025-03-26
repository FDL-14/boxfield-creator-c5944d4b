
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
  XCircle,
  Mail,
  FolderOpen,
  AlertTriangle,
  Lock,
  Edit,
  MoreVertical,
  Plus
} from "lucide-react";
import { FormBox, FormField, DocumentType, UserDocument } from "@/entities/all";
import { 
  saveFormData, 
  getSavedForms, 
  getSavedFormById, 
  getLockedSections, 
  isSectionLocked 
} from "@/utils/formUtils";
import { generatePDF } from "@/utils/pdfUtils";
import { SketchPicker } from "react-color";
import DrawSignature from "@/components/DrawSignature";
import CancelDocumentDialog from "@/components/CancelDocumentDialog";
import BiometricSignature from "@/components/BiometricSignature";
import { exportToExcel, exportToWord } from "@/utils/exportUtils";
import { getLocationData } from "@/utils/geoUtils";
import EmailDocumentDialog from "@/components/EmailDocumentDialog";
import SavedDocumentsDialog from "@/components/SavedDocumentsDialog";
import EditSectionDialog from "@/components/form-builder/EditSectionDialog";

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
  const [documentId, setDocumentId] = useState(null);
  const [lockedSections, setLockedSections] = useState([]);
  const formRef = useRef(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [savedDocsDialogOpen, setSavedDocsDialogOpen] = useState(false);
  const [showLockWarning, setShowLockWarning] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [isEditingField, setIsEditingField] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [editMode, setEditMode] = useState(false);

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

  // Effect to update locked sections when formValues changes
  useEffect(() => {
    const locked = getLockedSections(formValues, boxes, fields);
    setLockedSections(locked);
  }, [formValues, boxes, fields]);

  const handleInputChange = (fieldId, value) => {
    setFormValues(prevState => ({
      ...prevState,
      [fieldId]: value
    }));

    // If this is a signature field that just got a value, show the lock warning
    const field = fields.find(f => f.id === fieldId);
    if (field?.type === 'signature' && value && !formValues[fieldId]) {
      setShowLockWarning(true);
      setTimeout(() => setShowLockWarning(false), 5000); // Hide after 5 seconds
    }
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
        id: documentId || Date.now(),
        title: documentTitle,
        docType: docType,
        values: formValues,
        colors: customColors,
        logo: logoImage,
        createdAt: documentMetadata.created,
        location: locationData,
        cancelled: isCancelled,
        cancelInfo: cancelInfo,
        lockedSections: lockedSections,
        date: timestamp
      };
      
      // If this is the first save, set the document ID
      if (!documentId) {
        setDocumentId(documentData.id);
      }
      
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

  const printHandler = useReactToPrint({
    documentTitle: documentTitle,
    contentRef: formRef,
    onAfterPrint: () => {
      toast({
        title: "Documento impresso",
        description: "O documento foi enviado para impressão"
      });
    },
  });

  const handlePrint = () => {
    printHandler();
  };

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

  const handleSelectSavedDocument = (title, data) => {
    setDocumentTitle(title);
    
    if (data.id) {
      setDocumentId(data.id);
    }
    
    if (data.values) {
      setFormValues(data.values);
    }
    
    if (data.colors) {
      setCustomColors(data.colors);
    }
    
    if (data.logo) {
      setLogoImage(data.logo);
    }
    
    if (data.cancelled) {
      setIsCancelled(data.cancelled);
      setCancelInfo(data.cancelInfo);
    }

    if (data.lockedSections) {
      setLockedSections(data.lockedSections);
    } else if (data.values) {
      // Compute locked sections based on signature fields
      const locked = getLockedSections(data.values, boxes, fields);
      setLockedSections(locked);
    }

    if (data.createdAt) {
      setDocumentMetadata(prev => ({
        ...prev,
        created: data.createdAt
      }));
    }
    
    setSavedDocsDialogOpen(false);
    
    toast({
      title: "Documento carregado",
      description: "O documento foi carregado com sucesso"
    });
  };

  const checkSectionLocked = (boxId) => {
    return lockedSections.includes(boxId);
  };

  const handleEditSection = (boxId) => {
    if (checkSectionLocked(boxId)) {
      toast({
        title: "Seção bloqueada",
        description: "Esta seção contém assinaturas e não pode ser editada",
        variant: "warning"
      });
      return;
    }
    
    setCurrentSectionId(boxId);
    setEditSectionOpen(true);
  };

  const handleSaveSection = (newData) => {
    const updatedBoxes = boxes.map(box => 
      box.id === currentSectionId ? { ...box, name: newData.name || newData.title } : box
    );
    
    setBoxes(updatedBoxes);
    setEditSectionOpen(false);
    
    toast({
      title: "Seção atualizada",
      description: "As alterações foram salvas com sucesso"
    });
  };

  const handleEditField = (field) => {
    if (checkSectionLocked(field.box_id)) {
      toast({
        title: "Campo bloqueado",
        description: "Esta seção contém assinaturas e não pode ser editada",
        variant: "warning"
      });
      return;
    }
    
    setCurrentField(field);
    setIsEditingField(true);
  };

  const handleSaveField = (fieldId, updatedField) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId ? { ...field, ...updatedField } : field
    );
    
    setFields(updatedFields);
    setIsEditingField(false);
    setCurrentField(null);
    
    toast({
      title: "Campo atualizado",
      description: "As alterações foram salvas com sucesso"
    });
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const renderField = (field) => {
    // If we're in editing mode and this field is being edited
    if (editMode && isEditingField && currentField && currentField.id === field.id) {
      return renderFieldEditForm(field);
    }
    
    switch (field.type) {
      case "short_text":
        return (
          <div className="relative">
            <Input
              id={field.id}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.label}
              className="w-full"
            />
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "long_text":
        return (
          <div className="relative">
            <textarea
              id={field.id}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.label}
              className="w-full min-h-[100px] p-2 border rounded"
            />
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-2 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex items-center relative">
            <input
              type="checkbox"
              id={field.id}
              checked={formValues[field.id] || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="mr-2"
            />
            <label htmlFor={field.id}>{field.label}</label>
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "flag":
        return (
          <div className="space-y-2 relative">
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
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "flag_with_text":
        return (
          <div className="space-y-3 relative">
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
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "date":
        return (
          <div className="relative">
            <Input
              type="date"
              id={field.id}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full"
            />
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "time":
        return (
          <div className="relative">
            <Input
              type="time"
              id={field.id}
              value={formValues[field.id] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-full"
            />
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "signature":
        return (
          <div className="space-y-2 relative">
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
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "image":
        return (
          <div className="space-y-2 relative">
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
            {editMode && !checkSectionLocked(field.box_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 text-blue-500"
                onClick={() => handleEditField(field)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      default:
        return <p>Tipo de campo não suportado: {field.type}</p>;
    }
  };

  const renderFieldEditForm = (field) => {
    return (
      <div className="border p-4 rounded-lg bg-blue-50 animate-fade-in">
        <h4 className="font-medium mb-2">Editar Campo</h4>
        <div className="space-y-3">
          <div>
            <Label>Rótulo do Campo</Label>
            <Input 
              value={currentField.label || ""} 
              onChange={(e) => setCurrentField({...currentField, label: e.target.value})}
              className="mt-1"
            />
          </div>
          
          {(currentField.type === "flag" || currentField.type === "flag_with_text") && (
            <div className="space-y-2">
              <Label>Opções</Label>
              {(currentField.options || []).map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input 
                    value={option.text || ""}
                    onChange={(e) => {
                      const newOptions = [...currentField.options];
                      newOptions[idx].text = e.target.value;
                      setCurrentField({...currentField, options: newOptions});
                    }}
                    placeholder={`Opção ${idx + 1}`}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const newOptions = currentField.options.filter((_, i) => i !== idx);
                      setCurrentField({...currentField, options: newOptions});
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(currentField.options || []), {text: ""}];
                  setCurrentField({...currentField, options: newOptions});
                }}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
          )}
          
          {currentField.type === "signature" && (
            <div>
              <Label>Rótulo de Assinatura</Label>
              <Input 
                value={currentField.signature_label || ""} 
                onChange={(e) => setCurrentField({...currentField, signature_label: e.target.value})}
                className="mt-1"
                placeholder="Nome/Cargo"
              />
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingField(false);
                setCurrentField(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => handleSaveField(currentField.id, currentField)}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>
    );
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
              <h1 className="text-3xl font-bold text-gray-900">
                {documentId ? "Editar Documento" : "Criar Documento"}
              </h1>
            </div>
            <p className="text-gray-500 mt-1">
              Preencha os campos do documento e salve ou exporte
            </p>
          </div>

          {showLockWarning && (
            <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-md shadow-md flex items-center z-50 animate-fade-in">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              <div>
                <p className="font-medium">Seção bloqueada</p>
                <p className="text-sm">A seção com campo assinado foi bloqueada para edição</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={toggleEditMode}
              variant={editMode ? "default" : "outline"}
              className={editMode ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editMode ? "Modo Edição Ativo" : "Editar Documento"}
            </Button>
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
              onClick={() => setSavedDocsDialogOpen(true)}
              variant="outline"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Abrir
            </Button>
            <Button
              type="button"
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
            <Button
              onClick={() => setEmailDialogOpen(true)}
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar por E-mail
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

        {lockedSections.length > 0 && (
          <Card className="mb-4 border-yellow-300 bg-yellow-50">
            <CardContent className="p-4 flex items-center">
              <Lock className="h-5 w-5 text-yellow-700 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-800">Documento parcialmente bloqueado</h3>
                <p className="text-sm text-yellow-700">
                  Algumas seções deste documento foram assinadas e estão bloqueadas para edição. 
                  Apenas novas seções podem ser modificadas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div 
            ref={formRef}
            className="bg-white border rounded-lg shadow-sm p-6"
            style={{ backgroundColor: customColors.background, color: customColors.text }}
          >
            {isCancelled && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center transform rotate-45 opacity-30">
                  <span className="text-[8rem] text-red-600 font-bold whitespace-nowrap">
                    CANCELADO
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-6 p-4 rounded-t-lg" style={{ backgroundColor: customColors.header, color: "#fff" }}>
              <h2 className="text-xl font-bold">{documentTitle}</h2>
              {logoImage && (
                <div className="h-12 w-24 bg-white rounded flex items-center justify-center p-1">
                  <img src={logoImage} alt="Logo" className="max-h-10 max-w-20 object-contain" />
                </div>
              )}
            </div>
            
            {boxes.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">Nenhum campo configurado para este documento</p>
              </div>
            ) : (
              boxes.map((box) => (
                <div key={box.id} className="mb-6">
                  <div 
                    className={`text-lg font-semibold p-2 mb-3 rounded flex justify-between items-center`} 
                    style={{ backgroundColor: customColors.sectionHeader, color: "#fff" }}
                  >
                    <span>{box.name}</span>
                    <div className="flex items-center gap-2">
                      {checkSectionLocked(box.id) && (
                        <span className="text-xs bg-white text-orange-700 px-2 py-1 rounded-full flex items-center">
                          <Lock className="h-3 w-3 mr-1" /> Seção Bloqueada
                        </span>
                      )}
                      {editMode && !checkSectionLocked(box.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSection(box.id)}
                          className="text-white hover:bg-white/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                    {fields
                      .filter(field => field.box_id === box.id)
                      .map(field => (
                        <div key={field.id} className="mb-4">
                          <Label htmlFor={field.id} className="mb-2 block font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {renderField(field)}
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
            
            <div className="mt-8 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Informações do Documento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Data e Hora: </span>
                  {new Date(documentMetadata.created).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Localização: </span>
                  {documentMetadata.location.formatted}
                </div>
              </div>
              
              {isCancelled && cancelInfo && (
                <div className="mt-4 border-t pt-4 border-red-300">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">Documento Cancelado</h3>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="font-medium">Data de Cancelamento: </span>
                      {new Date(cancelInfo.timestamp).toLocaleString()}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Motivo: </span>
                      {cancelInfo.reason}
                    </div>
                    <div>
                      <span className="font-medium">Aprovadores: </span>
                      <ul className="list-disc ml-5">
                        {cancelInfo.approvers && cancelInfo.approvers.map((approver, idx) => (
                          <li key={idx}>
                            {approver.name} ({approver.role})
                            {approver.signature && (
                              <div className="mt-1 mb-2">
                                <img 
                                  src={approver.signature} 
                                  alt={`Assinatura de ${approver.name}`} 
                                  className="h-10 ml-2" 
                                />
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="save-title" className="mb-2 block">Título do Documento</Label>
              <Input
                id="save-title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Insira o título do documento"
              />
            </div>
            <div>
              <Label htmlFor="save-type" className="mb-2 block">Tipo de Documento</Label>
              <Select
                value={docType || "custom"}
                onValueChange={(value) => {
                  // This would typically update docType, but since it's from URL params
                  // we'd need to handle this differently in a real app
                }}
              >
                <SelectTrigger id="save-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Personalizado</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleSaveDocument(true)}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentColorTarget.type === "header" && "Escolher Cor do Cabeçalho"}
              {currentColorTarget.type === "sectionHeader" && "Escolher Cor das Seções"}
              {currentColorTarget.type === "background" && "Escolher Cor de Fundo"}
              {currentColorTarget.type === "text" && "Escolher Cor do Texto"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 flex justify-center">
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
            <Button onClick={() => setColorPickerOpen(false)}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desenhar Assinatura</DialogTitle>
          </DialogHeader>
          <DrawSignature onSave={handleSignatureSave} onCancel={() => setSignatureDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={biometricDialogOpen} onOpenChange={setBiometricDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {signatureType === "face" ? "Reconhecimento Facial" : "Impressão Digital"}
            </DialogTitle>
          </DialogHeader>
          <BiometricSignature 
            onCapture={handleBiometricCapture} 
            onCancel={() => setBiometricDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      <CancelDocumentDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onCancel={handleCancelDocument}
      />
      
      <EmailDocumentDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        documentTitle={documentTitle}
        documentData={{
          title: documentTitle,
          values: formValues,
          colors: customColors,
          logo: logoImage,
          cancelled: isCancelled,
          cancelInfo: cancelInfo
        }}
      />
      
      <SavedDocumentsDialog
        open={savedDocsDialogOpen}
        onClose={() => setSavedDocsDialogOpen(false)}
        docType={docType || "custom"}
        onSelectDocument={handleSelectSavedDocument}
      />
      
      <EditSectionDialog
        open={editSectionOpen}
        onClose={() => setEditSectionOpen(false)}
        onSave={handleSaveSection}
        section={boxes.find(box => box.id === currentSectionId) || {}}
        isLoading={false}
      />
    </div>
  );
}
