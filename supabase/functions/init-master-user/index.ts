
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
    
    // Handle profile creation or update in a more reliable way
    console.log("Handling profile for user ID:", masterUserId);
    
    let profileExists = false;
    const emptyArray: string[] = [];
    
    if (existingProfiles && existingProfiles.length > 0) {
      // Profile exists with master CPF
      profileExists = true;
      const existingProfile = existingProfiles[0];
      
      console.log("Found existing profile with master CPF:", existingProfile);
      
      // If the profile exists but with a different ID than our current auth user
      if (existingProfile.id !== masterUserId) {
        console.log("Existing profile has different ID. Current auth ID:", masterUserId, "Profile ID:", existingProfile.id);
        
        // First check if we already have a profile with the auth user ID
        const { data: authUserProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, cpf")
          .eq("id", masterUserId)
          .maybeSingle();
        
        if (authUserProfile) {
          console.log("Profile already exists for current auth ID, updating it");
          
          // Update the profile that matches our auth ID
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
              cpf: masterCPF,
              name: masterName,
              email: masterEmail,
              is_admin: true,
              is_master: true,
              company_ids: emptyArray,
              client_ids: emptyArray,
              updated_at: new Date().toISOString()
            })
            .eq("id", masterUserId);
            
          if (updateError) {
            console.error("Error updating profile with auth ID:", updateError);
            throw updateError;
          }
          
          // Now delete the profile with the master CPF but different ID to resolve conflicts
          // Only if it's not the same as our auth user ID
          if (existingProfile.id !== masterUserId) {
            console.log("Removing conflicting profile with ID:", existingProfile.id);
            const { error: deleteError } = await supabaseAdmin
              .from("profiles")
              .delete()
              .eq("id", existingProfile.id);
              
            if (deleteError) {
              console.error("Error removing conflicting profile:", deleteError);
            }
          }
        } else {
          // We don't have a profile with auth ID, but have one with master CPF
          // Move the existing profile to have the correct ID
          console.log("Moving master profile to use correct auth ID");
          
          // Create a new profile with the right ID
          const { error: insertNewError } = await supabaseAdmin
            .from("profiles")
            .insert({
              id: masterUserId,
              cpf: masterCPF,
              name: masterName,
              email: masterEmail,
              is_admin: true,
              is_master: true,
              company_ids: emptyArray,
              client_ids: emptyArray,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertNewError) {
            console.error("Error creating new profile:", insertNewError);
            // If we can't create the new profile, try updating the existing one
            if (insertNewError.code === '23505') { // Unique violation
              console.log("Unique violation, trying to update existing profile instead");
              const { error: updateError } = await supabaseAdmin
                .from("profiles")
                .update({
                  cpf: masterCPF,
                  name: masterName,
                  email: masterEmail,
                  is_admin: true,
                  is_master: true,
                  company_ids: emptyArray,
                  client_ids: emptyArray,
                  updated_at: new Date().toISOString()
                })
                .eq("id", masterUserId);
                
              if (updateError) {
                console.error("Error updating profile as fallback:", updateError);
                throw updateError;
              }
            } else {
              throw insertNewError;
            }
          }
          
          // Remove old profile if successful
          await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", existingProfile.id)
            .throwOnError();
            
          console.log("Removed old profile with incorrect ID");
        }
      } else {
        // Profile exists with correct ID, just update it
        console.log("Updating existing profile with correct user ID");
        
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            name: masterName,
            email: masterEmail,
            is_admin: true,
            is_master: true,
            company_ids: existingProfile.company_ids || emptyArray,
            client_ids: existingProfile.client_ids || emptyArray,
            updated_at: new Date().toISOString()
          })
          .eq("id", masterUserId);
          
        if (updateError) {
          console.error("Error updating profile:", updateError);
          throw updateError;
        }
      }
    } else {
      // No profile with master CPF exists, check if we have one with the auth ID
      const { data: existingProfileById } = await supabaseAdmin
        .from("profiles")
        .select("id, cpf")
        .eq("id", masterUserId)
        .maybeSingle();
        
      if (existingProfileById) {
        console.log("Profile exists for user ID but with different CPF, updating it");
        profileExists = true;
        
        // Update existing profile
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            cpf: masterCPF,
            name: masterName,
            email: masterEmail,
            is_admin: true,
            is_master: true,
            company_ids: existingProfileById.company_ids || emptyArray,
            client_ids: existingProfileById.client_ids || emptyArray,
            updated_at: new Date().toISOString()
          })
          .eq("id", masterUserId);
          
        if (updateError) {
          console.error("Error updating profile:", updateError);
          throw updateError;
        }
      }
    }
    
    // Create new profile if no profile exists
    if (!profileExists) {
      console.log("Creating new master user profile");
      
      const { error: insertProfileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: masterUserId,
          cpf: masterCPF,
          name: masterName,
          email: masterEmail,
          is_admin: true,
          is_master: true,
          company_ids: emptyArray,
          client_ids: emptyArray,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertProfileError) {
        console.error("Error creating profile:", insertProfileError);
        throw insertProfileError;
      }
    }
    
    console.log("Setting master permissions for user:", masterUserId);
    
    // Set all permissions for the master user
    await setMasterPermissions(supabaseAdmin, masterUserId);
    
    // Fetch the profile one last time to verify it was created correctly
    const { data: finalProfile, error: finalProfileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", masterUserId)
      .single();
      
    if (finalProfileError) {
      console.error("Error fetching final profile:", finalProfileError);
    } else {
      console.log("Final profile verification:", finalProfile);
    }
    
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
          can_delete_company: true,
          can_edit_document_type: true
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
          can_delete_company: true,
          can_edit_document_type: true
        }]);
    }
    
    // Verify permissions were set
    const { data: verifyPermissions } = await supabaseAdmin
      .from("user_permissions")
      .select("*")
      .eq("user_id", userId)
      .single();
      
    console.log("Verified permissions:", verifyPermissions ? "Set successfully" : "Failed to set");
    
    console.log("Master user permissions set successfully");
  } catch (error) {
    console.error("Error setting permissions:", error);
    throw error; // Re-throw so we can catch it in the main function
  }
}
