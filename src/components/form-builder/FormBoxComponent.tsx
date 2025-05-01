
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, PlusCircle, Trash2, Edit, LayoutGrid, AlignLeft, AlignCenter, AlignRight, Lock, Unlock } from "lucide-react";
import FieldComponent from "./FieldComponent";
import EditSectionDialog from "../form-builder/EditSectionDialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface FormBoxComponentProps {
  box: any;
  fields: any[];
  onAddField: () => void;
  onDeleteBox: () => void;
  onDeleteField: (fieldId: string) => void;
  onEditField: (fieldId: string, newData: any) => void;
  onEditBox?: (boxId: string, newData: any) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveField?: (fieldId: string, direction: 'up' | 'down') => void;
  onUpdateLayout?: (layout: any) => void;
  onToggleLockWhenSigned?: (value: boolean) => void;
  isLoading: boolean;
  isLocked?: boolean;
}

export default function FormBoxComponent({
  box,
  fields,
  onAddField,
  onDeleteBox,
  onDeleteField,
  onEditField,
  onEditBox,
  onMoveUp,
  onMoveDown,
  onMoveField,
  onUpdateLayout,
  onToggleLockWhenSigned,
  isLoading,
  isLocked = false
}: FormBoxComponentProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLayoutSettings, setShowLayoutSettings] = useState(false);
  const [showLockSettings, setShowLockSettings] = useState(false);

  const defaultLayout = {
    alignment: box.layout?.alignment || "left",
    columns: box.layout?.columns || 2,
    width: box.layout?.width || 100,
    padding: box.layout?.padding || 2,
    margin: box.layout?.margin || 2,
  };

  const [layoutSettings, setLayoutSettings] = useState(defaultLayout);
  const [lockWhenSigned, setLockWhenSigned] = useState(box.lockWhenSigned !== false);

  const handleEditBox = (newData: any) => {
    if (onEditBox) {
      onEditBox(box.id, newData);
      setShowEditDialog(false);
    }
  };

  const handleLayoutChange = (property: string, value: any) => {
    const newLayout = { ...layoutSettings, [property]: value };
    setLayoutSettings(newLayout);
    
    if (onUpdateLayout) {
      onUpdateLayout(newLayout);
    }
  };

  const handleLockWhenSignedChange = (value: boolean) => {
    setLockWhenSigned(value);
    if (onToggleLockWhenSigned) {
      onToggleLockWhenSigned(box.id, value);
    }
  };

  // Determine class names based on layout settings
  const getColumnClass = () => {
    if (box.layout?.columns === 1) return 'grid-cols-1';
    if (box.layout?.columns === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2'; // Default is 2 columns
  };

  const getAlignmentStyle = () => {
    return { textAlign: box.layout?.alignment || 'left' };
  };

  return (
    <Card 
      className={`section-container mx-auto`}
      style={{ 
        width: `${box.layout?.width || 100}%`,
        margin: `${box.layout?.margin || 0}px auto`
      }}
      data-alignment={box.layout?.alignment || "left"}
      data-width={box.layout?.width || 100}
      data-padding={box.layout?.padding || 2}
      data-margin={box.layout?.margin || 2}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{box.name}</CardTitle>
        <div className="flex space-x-2">
          {!isLocked && (
            <>
              {onMoveUp && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onMoveUp}
                  disabled={isLoading}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              )}
              {onMoveDown && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onMoveDown}
                  disabled={isLoading}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
              {onEditBox && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEditDialog(true)}
                  disabled={isLoading}
                  className="text-blue-500"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onUpdateLayout && (
                <Popover open={showLayoutSettings} onOpenChange={setShowLayoutSettings}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-purple-500"
                      disabled={isLoading}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Configurações de Layout</h4>
                      
                      <div className="space-y-2">
                        <Label>Alinhamento</Label>
                        <div className="flex space-x-2">
                          <Button 
                            variant={layoutSettings.alignment === "left" ? "default" : "outline"}
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleLayoutChange("alignment", "left")}
                          >
                            <AlignLeft className="h-4 w-4 mr-2" />
                            Esquerda
                          </Button>
                          <Button 
                            variant={layoutSettings.alignment === "center" ? "default" : "outline"}
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleLayoutChange("alignment", "center")}
                          >
                            <AlignCenter className="h-4 w-4 mr-2" />
                            Centro
                          </Button>
                          <Button 
                            variant={layoutSettings.alignment === "right" ? "default" : "outline"}
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleLayoutChange("alignment", "right")}
                          >
                            <AlignRight className="h-4 w-4 mr-2" />
                            Direita
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Colunas de Campos</Label>
                        <Select 
                          value={layoutSettings.columns.toString()} 
                          onValueChange={(value) => handleLayoutChange("columns", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o número de colunas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Coluna</SelectItem>
                            <SelectItem value="2">2 Colunas</SelectItem>
                            <SelectItem value="3">3 Colunas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Largura (%)</Label>
                          <span className="text-sm">{layoutSettings.width}%</span>
                        </div>
                        <Slider
                          value={[layoutSettings.width]}
                          min={50}
                          max={100}
                          step={5}
                          onValueChange={(value) => handleLayoutChange("width", value[0])}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Espaçamento Interno</Label>
                          <span className="text-sm">{layoutSettings.padding}</span>
                        </div>
                        <Slider
                          value={[layoutSettings.padding]}
                          min={0}
                          max={8}
                          step={1}
                          onValueChange={(value) => handleLayoutChange("padding", value[0])}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Margem Externa</Label>
                          <span className="text-sm">{layoutSettings.margin}</span>
                        </div>
                        <Slider
                          value={[layoutSettings.margin]}
                          min={0}
                          max={8}
                          step={1}
                          onValueChange={(value) => handleLayoutChange("margin", value[0])}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {onToggleLockWhenSigned && (
                <Popover open={showLockSettings} onOpenChange={setShowLockSettings}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={lockWhenSigned ? "text-amber-500" : "text-gray-500"}
                      disabled={isLoading}
                    >
                      {lockWhenSigned ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Configurações de Bloqueio</h4>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lock-when-signed">Bloquear seção após assinatura</Label>
                        <Switch
                          id="lock-when-signed"
                          checked={lockWhenSigned}
                          onCheckedChange={handleLockWhenSignedChange}
                        />
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {lockWhenSigned ? (
                          <p>Esta seção será bloqueada para edição após qualquer campo de assinatura ser assinado no documento.</p>
                        ) : (
                          <p>Esta seção continuará editável mesmo após a assinatura no documento.</p>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={onDeleteBox}
                disabled={isLoading}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {isLocked && (
            <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Seção Bloqueada
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent 
        className={`p-${box.layout?.padding || 4}`}
        style={getAlignmentStyle()}
      >
        <div 
          className={`field-container grid ${getColumnClass()} gap-4`}
          data-columns={box.layout?.columns || 2}
        >
          {fields.map((field, index) => (
            <FieldComponent
              key={field.id}
              field={field}
              onDelete={() => onDeleteField(field.id)}
              onEdit={(newData) => onEditField(field.id, newData)}
              onMoveUp={index > 0 && onMoveField && !isLocked ? () => onMoveField(field.id, 'up') : undefined}
              onMoveDown={index < fields.length - 1 && onMoveField && !isLocked ? () => onMoveField(field.id, 'down') : undefined}
              isLoading={isLoading}
              isLocked={isLocked}
            />
          ))}

          {fields.length === 0 && (
            <div className="text-center p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-gray-500">
                Nenhum campo adicionado a esta seção.
              </p>
            </div>
          )}

          {!isLocked && (
            <div className="pt-2">
              <Button
                onClick={onAddField}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Campo
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {showEditDialog && (
        <EditSectionDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSave={handleEditBox}
          section={box}
          isLoading={isLoading}
        />
      )}
    </Card>
  );
}
