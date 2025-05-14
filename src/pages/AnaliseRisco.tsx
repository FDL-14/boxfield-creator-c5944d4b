import React from 'react';
import Header from '@/components/Header';

const AnaliseRisco = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <Header 
        title="Análise de Risco" 
        subtitle="Documentos para análise de riscos em atividades" 
      />
      
      <div className="mt-8">
        {/* Page content */}
        <p>Conteúdo da página de Análise de Risco.</p>
      </div>
    </div>
  );
};

export default AnaliseRisco;
