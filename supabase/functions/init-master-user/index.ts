
// Supabase Edge Function to initialize the master user
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("Hello from init-master-user Edge Function!");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase admin client
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
    
    // Master user details
    const masterCPF = "80243088191";
    const masterName = "Fabiano Domingues Luciano";
    const masterEmail = "fabiano@totalseguranca.net";
    const masterPassword = "@54321"; // Default password
    
    // Check if master user already exists in profiles table
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, cpf")
      .eq("cpf", masterCPF)
      .limit(1);
    
    if (profilesError) {
      throw profilesError;
    }
    
    let userId;
    
    // If master user already exists in profiles
    if (existingProfiles && existingProfiles.length > 0) {
      console.log("Master user already exists in profiles");
      userId = existingProfiles[0].id;
      
      // Ensure user profile has the correct flags
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          is_admin: true,
          is_master: true,
          name: masterName,
          email: masterEmail
        })
        .eq("cpf", masterCPF);
        
      if (updateError) {
        console.error("Error updating profile:", updateError);
      }
    } else {
      // If not found in profiles, check auth.users by email
      const { data: users, error: usersError } = await supabaseAdmin
        .auth.admin.listUsers();
      
      const masterUser = users?.users.find(user => 
        user.email === masterEmail || 
        user.user_metadata?.real_email === masterEmail
      );
      
      if (masterUser) {
        // User exists in auth but not in profiles
        userId = masterUser.id;
        
        // Create the profile entry
        await supabaseAdmin
          .from("profiles")
          .insert({
            id: userId,
            name: masterName,
            email: masterEmail,
            cpf: masterCPF,
            is_admin: true,
            is_master: true
          });
      } else {
        // User doesn't exist at all, create a new one
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: masterEmail,
          password: masterPassword,
          email_confirm: true,
          user_metadata: {
            name: masterName,
            cpf: masterCPF,
            is_admin: true,
            is_master: true
          },
        });
        
        if (authError) {
          throw authError;
        }
        
        userId = authData.user.id;
        
        // Update the profile
        const { error: profileUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({
            is_admin: true,
            is_master: true,
            cpf: masterCPF
          })
          .eq("id", userId);
          
        if (profileUpdateError) {
          console.error("Error updating new profile:", profileUpdateError);
        }
      }
    }
    
    // Set all permissions for the master user
    await setMasterPermissions(supabaseAdmin, userId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Master user initialized successfully",
        userId: userId
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
        message: error.message || "An unknown error occurred" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function setMasterPermissions(supabaseAdmin: any, userId: string) {
  try {
    // Check if permissions exist
    const { data: existingPermissions } = await supabaseAdmin
      .from("user_permissions")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
      
    if (existingPermissions && existingPermissions.length > 0) {
      // Update existing permissions to grant all access
      await supabaseAdmin
        .from("user_permissions")
        .update({
          can_create: true,
          can_edit: true,
          can_delete: true,
          can_create_user: true,
          can_edit_user: true,
          can_edit_user_status: true,
          can_set_user_permissions: true,
          can_create_section: true,
          can_edit_section: true,
          can_delete_section: true,
          can_create_field: true,
          can_edit_field: true,
          can_delete_field: true,
          can_fill_field: true,
          can_sign: true,
          can_insert_logo: true,
          can_insert_photo: true,
          can_save: true,
          can_save_as: true,
          can_download: true,
          can_open: true,
          can_print: true,
          can_edit_document: true,
          can_cancel_document: true,
          can_view: true,
          view_all_actions: true,
          can_view_reports: true
        })
        .eq("id", existingPermissions[0].id);
    } else {
      // Create new permissions granting all access
      await supabaseAdmin
        .from("user_permissions")
        .insert([{
          user_id: userId,
          can_create: true,
          can_edit: true,
          can_delete: true,
          can_create_user: true,
          can_edit_user: true,
          can_edit_user_status: true,
          can_set_user_permissions: true,
          can_create_section: true,
          can_edit_section: true,
          can_delete_section: true,
          can_create_field: true,
          can_edit_field: true,
          can_delete_field: true,
          can_fill_field: true,
          can_sign: true,
          can_insert_logo: true,
          can_insert_photo: true,
          can_save: true,
          can_save_as: true,
          can_download: true,
          can_open: true,
          can_print: true,
          can_edit_document: true,
          can_cancel_document: true,
          can_view: true,
          view_all_actions: true,
          can_view_reports: true
        }]);
    }
    
    console.log("Master user permissions set successfully");
  } catch (error) {
    console.error("Error setting permissions:", error);
  }
}
