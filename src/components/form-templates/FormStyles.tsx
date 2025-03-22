
import React from "react";

export const FormHeader = ({ title, number, revision }) => (
  <div className="flex justify-between items-center bg-orange-500 text-white p-2 font-bold">
    <div className="flex items-center">
      <img 
        src="/lovable-uploads/b383b9e2-8185-41a7-9b33-bedebd3830a0.png" 
        alt="Logo Atvos" 
        className="h-8 mr-4"
      />
      <h1 className="text-xl uppercase">{title}</h1>
    </div>
    <div className="flex gap-4">
      <div className="border border-white p-1 px-2">
        <span>{number}</span>
      </div>
      <div className="border border-white p-1 px-2">
        <span>REVISÃO {revision}</span>
      </div>
    </div>
  </div>
);

export const SectionHeader = ({ title, number }) => (
  <div className="bg-orange-500 text-white p-2 font-bold">
    <h2 className="text-md">{number}. {title}</h2>
  </div>
);

export const FormTable = ({ children }) => (
  <div className="border border-gray-300">
    <table className="w-full border-collapse">
      {children}
    </table>
  </div>
);

export const FormRow = ({ children, header = false }) => (
  <tr className={`${header ? 'bg-orange-500 text-white' : 'border-t border-gray-300'}`}>
    {children}
  </tr>
);

export const FormCell = ({ children, header = false, width, span = 1, align = "left" }) => (
  <td 
    className={`
      p-2 ${header ? 'font-bold' : 'border-r border-gray-300'} 
      ${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"}
    `} 
    style={{ width: width }}
    colSpan={span}
  >
    {children}
  </td>
);

export const FormCheckbox = ({ label, id }) => (
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 border border-black"></div>
    <label htmlFor={id}>{label}</label>
  </div>
);

export const FormInput = ({ placeholder = "", className = "" }) => (
  <div className={`border-b border-gray-400 w-full ${className}`}>
    <div className="min-h-[1.5rem]">
      {placeholder}
    </div>
  </div>
);

export const FormSignatureField = ({ label, smallLabel = false }) => (
  <div className="flex flex-col items-center">
    <div className="w-full border-b border-gray-400 h-8"></div>
    <p className={`text-center mt-1 ${smallLabel ? "text-xs" : "text-sm"}`}>{label}</p>
  </div>
);
