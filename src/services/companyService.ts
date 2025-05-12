
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço responsável por gerenciar empresas e clientes
 */
export const CompanyService = {
  /**
   * Lista todas as empresas
   */
  listCompanies: async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return { companies: data || [], error: null };
    } catch (error: any) {
      console.error("Erro ao listar empresas:", error);
      return { companies: [], error: error.message };
    }
  },
  
  /**
   * Obtém uma empresa por ID
   */
  getCompanyById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { company: data, error: null };
    } catch (error: any) {
      console.error("Erro ao obter empresa por ID:", error);
      return { company: null, error: error.message };
    }
  },
  
  /**
   * Cria uma nova empresa
   */
  createCompany: async (companyData: {
    name: string;
    address?: string;
    cnpj?: string;
    phone?: string;
    logo?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          id: uuidv4()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { company: data, error: null };
    } catch (error: any) {
      console.error("Erro ao criar empresa:", error);
      return { company: null, error: error.message };
    }
  },
  
  /**
   * Atualiza uma empresa existente
   */
  updateCompany: async (id: string, companyData: {
    name?: string;
    address?: string;
    cnpj?: string;
    phone?: string;
    logo?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({
          ...companyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { company: data, error: null };
    } catch (error: any) {
      console.error("Erro ao atualizar empresa:", error);
      return { company: null, error: error.message };
    }
  },
  
  /**
   * Lista todos os clientes
   */
  listClients: async (companyId?: string) => {
    try {
      let query = supabase
        .from('clients')
        .select('*, company:companies(name)')
        .order('name');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { clients: data || [], error: null };
    } catch (error: any) {
      console.error("Erro ao listar clientes:", error);
      return { clients: [], error: error.message };
    }
  },
  
  /**
   * Obtém um cliente por ID
   */
  getClientById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, company:companies(name)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { client: data, error: null };
    } catch (error: any) {
      console.error("Erro ao obter cliente por ID:", error);
      return { client: null, error: error.message };
    }
  },
  
  /**
   * Cria um novo cliente
   */
  createClient: async (clientData: {
    name: string;
    company_id: string;
    is_internal?: boolean;
    address?: string;
    document_id?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          id: uuidv4()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { client: data, error: null };
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      return { client: null, error: error.message };
    }
  },
  
  /**
   * Atualiza um cliente existente
   */
  updateClient: async (id: string, clientData: {
    name?: string;
    company_id?: string;
    is_internal?: boolean;
    address?: string;
    document_id?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...clientData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { client: data, error: null };
    } catch (error: any) {
      console.error("Erro ao atualizar cliente:", error);
      return { client: null, error: error.message };
    }
  }
};
