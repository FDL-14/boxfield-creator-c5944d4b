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
    
    // Step 1: Ensure the auth user exists
    let masterAuthUser;
    let masterUserId;
    
    // Check if master user exists in auth.users
    const { data: existingUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error checking auth users:", usersError);
      throw usersError;
    }
    
    // Look for users with master email or CPF in metadata
    const masterAuthUsers = existingUsers.users.filter(user => 
      user.email === masterEmail || 
      (user.user_metadata && user.user_metadata.cpf === masterCPF)
    );
    
    console.log(`Found ${masterAuthUsers.length} potential master auth users`);
    
    if (masterAuthUsers.length > 0) {
      // Use the first matching user
      masterAuthUser = masterAuthUsers[0];
      masterUserId = masterAuthUser.id;
      
      console.log("Using existing auth user with ID:", masterUserId);
      
      // Update the user metadata
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
    } else {
      console.log("No master auth user found, creating new one");
      
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
      
      console.log("Created new master auth user with ID:", masterUserId);
    }
    
    // Step 2: Handle profile creation/update
    console.log("Processing profile for master user ID:", masterUserId);
    
    // Define empty arrays once
    const emptyArray: string[] = [];
    
    // Check for any existing profiles with master CPF
    const { data: profilesWithMasterCPF, error: cpfProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, cpf, email, is_master, is_admin, company_ids, client_ids")
      .eq("cpf", masterCPF);
      
    if (cpfProfileError) {
      console.error("Error checking for profiles with master CPF:", cpfProfileError);
      throw cpfProfileError;
    }
    
    console.log(`Found ${profilesWithMasterCPF ? profilesWithMasterCPF.length : 0} profiles with master CPF`);
    
    // Check for profile with the correct auth ID
    const { data: profileWithAuthId, error: authProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, cpf, email, is_master, is_admin, company_ids, client_ids")
      .eq("id", masterUserId)
      .maybeSingle();
      
    if (authProfileError) {
      console.error("Error checking for profile with auth ID:", authProfileError);
      throw authProfileError;
    }
    
    console.log("Profile with auth ID exists:", profileWithAuthId ? "Yes" : "No");
    
    // Decision tree for profile handling
    if (profileWithAuthId) {
      // We have a profile with the correct ID, update it
      console.log("Updating existing profile with auth ID:", masterUserId);
      
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          cpf: masterCPF,
          name: masterName,
          email: masterEmail,
          is_admin: true,
          is_master: true,
          company_ids: profileWithAuthId.company_ids || emptyArray,
          client_ids: profileWithAuthId.client_ids || emptyArray,
          updated_at: new Date().toISOString()
        })
        .eq("id", masterUserId);
        
      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }
      
      console.log("Profile updated successfully");
      
    } else if (profilesWithMasterCPF && profilesWithMasterCPF.length > 0) {
      // We have profiles with the master CPF but none with the auth ID
      console.log("Found profiles with master CPF but none with correct auth ID");
      
      // Use the first profile with master CPF
      const existingProfile = profilesWithMasterCPF[0];
      
      // Create a new profile with the correct ID
      console.log("Creating new profile with correct auth ID");
      
      try {
        const { error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: masterUserId,
            cpf: masterCPF,
            name: masterName,
            email: masterEmail,
            is_admin: true,
            is_master: true,
            company_ids: existingProfile.company_ids || emptyArray,
            client_ids: existingProfile.client_ids || emptyArray,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error("Error creating new profile:", insertError);
          throw insertError;
        }
        
        console.log("New profile created successfully");
        
        // Delete old profiles with master CPF but different ID
        for (const oldProfile of profilesWithMasterCPF) {
          if (oldProfile.id !== masterUserId) {
            console.log("Deleting old profile with ID:", oldProfile.id);
            
            const { error: deleteError } = await supabaseAdmin
              .from("profiles")
              .delete()
              .eq("id", oldProfile.id);
              
            if (deleteError) {
              console.error("Error deleting old profile:", deleteError);
              // Continue even if there's an error
            }
          }
        }
      } catch (error) {
        // Handle unique constraint violation
        if (error.code === '23505') { // Unique violation
          console.log("Unique violation encountered, trying update instead");
          
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
            console.error("Error in fallback update:", updateError);
            throw updateError;
          }
        } else {
          throw error;
        }
      }
      
    } else {
      // No profile exists either with master CPF or auth ID, create a new one
      console.log("No profile exists, creating new one");
      
      const { error: createProfileError } = await supabaseAdmin
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
        
      if (createProfileError) {
        console.error("Error creating new profile:", createProfileError);
        throw createProfileError;
      }
      
      console.log("New profile created successfully");
    }
    
    // Step 3: Set all permissions for the master user
    console.log("Setting permissions for master user");
    await setMasterPermissions(supabaseAdmin, masterUserId);
    
    // Final verification
    const { data: finalProfile, error: finalProfileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", masterUserId)
      .maybeSingle();
      
    if (finalProfileError) {
      console.error("Error in final profile verification:", finalProfileError);
      throw finalProfileError;
    }
    
    if (!finalProfile) {
      console.error("Final verification failed: Profile not found");
      throw new Error("Final verification failed: Profile not found");
    }
    
    console.log("Final profile verification successful:", finalProfile);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Master user initialized successfully",
        userId: masterUserId,
        profile: finalProfile
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

// Helper function to set master permissions
async function setMasterPermissions(supabaseAdmin: any, userId: string) {
  try {
    // Check if permissions already exist
    const { data: existingPermissions, error: checkError } = await supabaseAdmin
      .from("user_permissions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking existing permissions:", checkError);
      throw checkError;
    }
    
    // Full permissions object - Use only fields that exist in the database schema
    // IMPORTANT: Removed the problematic 'can_cancel_document' field and others that don't exist
    const fullPermissions = {
      user_id: userId,
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_edit_user: true,
      can_edit_action: true,
      can_edit_client: true,
      can_edit_company: true,
      can_delete_client: true,
      can_delete_company: true,
      can_mark_complete: true,
      can_mark_delayed: true,
      can_add_notes: true,
      can_view_reports: true,
      view_all_actions: true,
      can_edit_document_type: true
    };
    
    if (existingPermissions) {
      // Update existing permissions
      console.log("Updating existing permissions with ID:", existingPermissions.id);
      
      const { error: updateError } = await supabaseAdmin
        .from("user_permissions")
        .update(fullPermissions)
        .eq("id", existingPermissions.id);
        
      if (updateError) {
        console.error("Error updating permissions:", updateError);
        throw updateError;
      }
    } else {
      // Create new permissions
      console.log("Creating new permissions for user:", userId);
      
      const { error: createError } = await supabaseAdmin
        .from("user_permissions")
        .insert([fullPermissions]);
        
      if (createError) {
        console.error("Error creating permissions:", createError);
        throw createError;
      }
    }
    
    // Verify permissions were set correctly
    const { data: verifiedPermissions, error: verifyError } = await supabaseAdmin
      .from("user_permissions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (verifyError) {
      console.error("Error verifying permissions:", verifyError);
      throw verifyError;
    }
    
    if (!verifiedPermissions) {
      console.error("Permissions verification failed: No permissions found");
      throw new Error("Permissions verification failed");
    }
    
    console.log("Master permissions set and verified successfully");
    return true;
  } catch (error) {
    console.error("Error in setMasterPermissions:", error);
    throw error;
  }
}
