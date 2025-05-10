
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
    
    console.log("Initializing master user with CPF:", masterCPF);
    
    // Check if master user exists in auth.users
    const { data: existingUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error checking auth users:", usersError);
      throw usersError;
    }
    
    let masterAuthUser = existingUsers.users.find(user => 
      user.email === masterEmail || 
      (user.user_metadata && user.user_metadata.cpf === masterCPF)
    );
    
    console.log("Master auth user check:", masterAuthUser ? "Found" : "Not found");
    
    // Check profiles table for the master CPF
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, cpf, email, is_master, is_admin")
      .eq("cpf", masterCPF)
      .limit(1);
    
    if (profilesError) {
      console.error("Error checking profiles:", profilesError);
      throw profilesError;
    }
    
    console.log("Existing profiles check result:", existingProfiles);
    
    let masterUserId;
    
    // Handle auth user creation or update
    if (!masterAuthUser) {
      console.log("Creating master auth user");
      
      // Create new auth user
      const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
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
      
      if (createAuthError) {
        console.error("Error creating auth user:", createAuthError);
        throw createAuthError;
      }
      
      masterAuthUser = newAuthUser.user;
      masterUserId = masterAuthUser.id;
      
      console.log("Created master auth user with ID:", masterUserId);
    } else {
      masterUserId = masterAuthUser.id;
      console.log("Using existing auth user with ID:", masterUserId);
      
      // Update existing auth user
      try {
        await supabaseAdmin.auth.admin.updateUserById(masterUserId, {
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
        console.log("Updated master auth user data");
      } catch (updateError) {
        console.error("Error updating auth user:", updateError);
      }
    }
    
    // Handle profile creation or update
    if (!existingProfiles || existingProfiles.length === 0) {
      // Create new profile
      console.log("Creating master user profile");
      
      const { error: insertProfileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: masterUserId,
          cpf: masterCPF,
          name: masterName,
          email: masterEmail,
          is_admin: true,
          is_master: true
        });
        
      if (insertProfileError) {
        console.error("Error creating profile:", insertProfileError);
      }
    } else {
      const existingProfileId = existingProfiles[0].id;
      
      // If the profile exists but with a different ID than the auth user,
      // update the auth profile linkage
      if (existingProfileId !== masterUserId) {
        console.log("Profile exists with different ID, updating linkage");
        
        // First delete the old profile
        const { error: deleteError } = await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", existingProfileId);
          
        if (deleteError) {
          console.error("Error deleting old profile:", deleteError);
        }
        
        // Then create a new one with the correct ID
        const { error: insertNewProfileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: masterUserId,
            cpf: masterCPF,
            name: masterName,
            email: masterEmail,
            is_admin: true,
            is_master: true
          });
          
        if (insertNewProfileError) {
          console.error("Error creating new profile with correct ID:", insertNewProfileError);
        }
      } else {
        // Update existing profile
        console.log("Updating existing profile");
        
        const { error: updateProfileError } = await supabaseAdmin
          .from("profiles")
          .update({
            name: masterName,
            email: masterEmail,
            is_admin: true,
            is_master: true
          })
          .eq("id", masterUserId);
          
        if (updateProfileError) {
          console.error("Error updating profile:", updateProfileError);
        }
      }
    }
    
    console.log("Setting master permissions for user:", masterUserId);
    
    // Set all permissions for the master user
    await setMasterPermissions(supabaseAdmin, masterUserId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Master user initialized successfully",
        userId: masterUserId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in init-master-user function:", error);
    
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
          can_view_reports: true,
          can_mark_complete: true,
          can_mark_delayed: true,
          can_add_notes: true,
          can_edit_action: true,
          can_edit_client: true,
          can_edit_company: true,
          can_delete_client: true,
          can_delete_company: true
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
          can_view_reports: true,
          can_mark_complete: true,
          can_mark_delayed: true,
          can_add_notes: true,
          can_edit_action: true,
          can_edit_client: true,
          can_edit_company: true,
          can_delete_client: true,
          can_delete_company: true
        }]);
    }
    
    console.log("Master user permissions set successfully");
  } catch (error) {
    console.error("Error setting permissions:", error);
  }
}
