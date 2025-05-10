
// Supabase Edge Function for CPF-based login
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
    const { cpf, password } = await req.json();
    
    if (!cpf || !password) {
      return new Response(
        JSON.stringify({ message: "CPF e senha são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Login attempt with CPF:", cpf);
    
    // Clean the CPF (remove non-digits)
    const cleanedCpf = cpf.replace(/\D/g, '');
    
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
    
    // 1. First, try direct login with master credentials for the hardcoded master user
    if (cleanedCpf === "80243088191") {
      console.log("Attempting master user login");
      
      try {
        // Try to sign in with email
        const { data: masterSignInData, error: masterSignInError } = await supabaseAdmin.auth.signInWithPassword({
          email: "fabiano@totalseguranca.net",
          password: password,
        });
        
        if (!masterSignInError && masterSignInData.session) {
          console.log("Master login successful with direct email");
          return new Response(
            JSON.stringify({ 
              session: masterSignInData.session, 
              user: masterSignInData.user
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          console.log("Master login attempt failed with direct email, will try profile lookup");
        }
      } catch (directMasterError) {
        console.error("Direct master login error:", directMasterError);
      }
    }
    
    // 2. Find the user by CPF in the profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, cpf, email")
      .eq("cpf", cleanedCpf)
      .limit(1);
    
    if (profilesError) {
      console.error("Error fetching profile by CPF:", profilesError);
      throw new Error("Erro ao buscar usuário");
    }
    
    console.log("Profiles found:", profiles ? profiles.length : 0);
    
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "Usuário não encontrado com este CPF" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const userId = profiles[0].id;
    const userEmail = profiles[0].email || `${cleanedCpf}@cpflogin.local`;
    
    console.log("User ID found:", userId);
    console.log("User email for login:", userEmail);
    
    // 3. Try to sign in with password
    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });
      
      if (error) {
        console.error("Sign-in error:", error);
        return new Response(
          JSON.stringify({ message: "Credenciais inválidas", details: error.message }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      console.log("Login successful");
      
      return new Response(
        JSON.stringify({ session: data.session, user: data.user }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (signInError) {
      console.error("Sign in attempt failed:", signInError);
      return new Response(
        JSON.stringify({ message: "Erro ao tentar autenticação", details: signInError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("General error in login-with-cpf:", error);
    return new Response(
      JSON.stringify({ message: error.message || "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
