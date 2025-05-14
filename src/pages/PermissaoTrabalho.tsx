import React from 'react';
import Header from '@/components/Header';

const PermissaoTrabalho = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Header 
        title="Permissão de Trabalho" 
        subtitle="Documentos de permissão para atividades específicas" 
      />
      
      <div className="mt-8">
        {/* Page content */}
        <p>Conteúdo da página de Permissão de Trabalho.</p>
      </div>
    </div>
  );
};

export default PermissaoTrabalho;
