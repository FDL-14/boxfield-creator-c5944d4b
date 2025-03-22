
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import FieldComponent from "./FieldComponent";

export default function FormBoxComponent({
  box,
  fields,
  onAddField,
  onDeleteBox,
  onDeleteField,
  onEditField,
  isLoading
}) {
  return (
    <Card className="shadow-md animate-fade-in transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{box.title}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddField}
            disabled={isLoading}
            className="transition-all duration-300"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            Adicionar Campo
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 transition-all duration-300"
            onClick={() => onDeleteBox(box.id)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map(field => (
            <FieldComponent
              key={field.id}
              field={field}
              onDelete={() => onDeleteField(field.id)}
              onEdit={(newData) => onEditField(field.id, newData)}
              isLoading={isLoading}
            />
          ))}
          {fields.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Nenhum campo adicionado nesta seção
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
