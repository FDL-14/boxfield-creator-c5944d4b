
// Supabase Edge Function to create a user with CPF authentication
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { cpf, password, name, email } = await req.json();
    
    if (!cpf || !password || !name || !email) {
      return new Response(
        JSON.stringify({ message: "Todos os campos são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Create a Supabase client with the admin role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Check if user with this CPF already exists
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("cpf", cpf.replace(/\D/g, ''))
      .limit(1);
    
    if (profilesError) {
      throw new Error("Erro ao verificar CPF existente");
    }
    
    if (existingProfiles && existingProfiles.length > 0) {
      return new Response(
        JSON.stringify({ message: "CPF já cadastrado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Create a new user with the provided email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        cpf: cpf.replace(/\D/g, ''),
        real_email: email,
      },
    });
    
    if (authError) {
      throw authError;
    }
    
    // Update the profile to include the CPF
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        cpf: cpf.replace(/\D/g, ''),
        name,
        email,
      })
      .eq("id", authData.user.id);
    
    if (updateError) {
      console.error("Error updating profile:", updateError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Usuário criado com sucesso",
        userId: authData.user.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Ocorreu um erro ao criar o usuário" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
