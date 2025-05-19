
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Hello from init-master-user Edge Function!");

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Master user details
const masterCPF = "80243088191"; // Fixed CPF for master user
const masterEmail = "fabiano@totalseguranca.net"; // Fixed email for master user
const masterName = "Fabiano Domingues Luciano"; // Master user name

serve(async (req: Request) => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`Initializing master user with CPF: ${masterCPF}`);
    
    // 1. Check if we already have an auth user with master email
    const { data: authUsers, error: authError } = await supabase.auth.admin
      .listUsers({ page: 1, perPage: 10 });
      
    if (authError) {
      throw new Error(`Error listing auth users: ${authError.message}`);
    }
    
    let masterAuthId: string | undefined;
    const masterAuthUsers = authUsers.users.filter(user => 
      user.email === masterEmail || 
      (user.user_metadata && user.user_metadata.cpf === masterCPF)
    );
    
    console.log(`Found ${masterAuthUsers.length} potential master auth users`);
    
    if (masterAuthUsers.length > 0) {
      // Use first found user
      masterAuthId = masterAuthUsers[0].id;
      console.log(`Using existing auth user with ID: ${masterAuthId}`);
      
      // Update user data to ensure it's correct
      await supabase.auth.admin.updateUserById(masterAuthId, {
        user_metadata: { 
          cpf: masterCPF,
          name: masterName,
          is_master: true,
          is_admin: true
        },
        email: masterEmail
      });
      
      console.log(`Updated master auth user data`);
    } else {
      // Create a new auth user if none found
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: masterEmail,
        password: `Master${Date.now()}!`,  // Random secure password
        email_confirm: true,  // Auto confirm email
        user_metadata: { 
          cpf: masterCPF,
          name: masterName,
          is_master: true,
          is_admin: true  
        }
      });
      
      if (createError) {
        throw new Error(`Error creating master user: ${createError.message}`);
      }
      
      masterAuthId = newUser.user.id;
      console.log(`Created new auth user for master with ID: ${masterAuthId}`);
    }
    
    // 2. Make sure there is a corresponding profile
    console.log(`Processing profile for master user ID: ${masterAuthId}`);
    
    // Check if profile with master CPF exists
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('cpf', masterCPF);
      
    if (profilesError) {
      throw new Error(`Error checking for existing profiles: ${profilesError.message}`);
    }
    
    console.log(`Found ${existingProfiles?.length} profiles with master CPF`);
    
    // Check if profile with auth ID exists (may be different from CPF profile)
    const { data: authIdProfile, error: authIdProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', masterAuthId)
      .maybeSingle();
      
    if (authIdProfileError) {
      throw new Error(`Error checking for auth ID profile: ${authIdProfileError.message}`);
    }
    
    console.log(`Profile with auth ID exists: ${authIdProfile ? 'Yes' : 'No'}`);
    
    if (authIdProfile) {
      // Update existing profile
      console.log(`Updating existing profile with auth ID: ${masterAuthId}`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: masterName,
          email: masterEmail,
          cpf: masterCPF,
          is_admin: true,
          is_master: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', masterAuthId);
        
      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }
      
      console.log("Profile updated successfully");
    } else if (existingProfiles && existingProfiles.length > 0) {
      // There's a profile with the master CPF but different ID
      // Update it to have the auth ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          id: masterAuthId,  // Change ID to match auth ID
          name: masterName,
          email: masterEmail,
          cpf: masterCPF,
          is_admin: true,
          is_master: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfiles[0].id);
        
      if (updateError) {
        throw new Error(`Error updating profile ID: ${updateError.message}`);
      }
      
      console.log(`Updated profile ID from ${existingProfiles[0].id} to ${masterAuthId}`);
    } else {
      // Create a new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: masterAuthId,
          name: masterName,
          email: masterEmail,
          cpf: masterCPF,
          is_admin: true,
          is_master: true,
          role: "user",
          company_ids: [], // Default empty array
          client_ids: []  // Default empty array
        }]);
        
      if (insertError) {
        throw new Error(`Error creating profile: ${insertError.message}`);
      }
      
      console.log("New profile created successfully");
    }
    
    // 3. Set up master permissions
    console.log("Setting permissions for master user");
    
    // Check if permissions already exist
    const { data: existingPermissions, error: permError } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', masterAuthId)
      .maybeSingle();
      
    if (permError) {
      throw new Error(`Error checking for existing permissions: ${permError.message}`);
    }
    
    // Create all permissions object - grant ALL permissions
    const masterPermissions = {
      user_id: masterAuthId,
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
      can_edit_document_type: true,
      can_mark_complete: true,
      can_mark_delayed: true,
      can_add_notes: true,
      can_view_reports: true,
      can_view: true,
      can_edit_action: true,
      can_edit_client: true,
      can_delete_client: true,
      can_edit_company: true,
      can_delete_company: true,
      view_all_actions: true
    };
    
    if (existingPermissions) {
      // Update existing permissions
      console.log(`Updating existing permissions with ID: ${existingPermissions.id}`);
      
      const { error: updatePermError } = await supabase
        .from('user_permissions')
        .update(masterPermissions)
        .eq('user_id', masterAuthId);
        
      if (updatePermError) {
        throw new Error(`Error updating permissions: ${updatePermError.message}`);
      }
    } else {
      // Create new permissions
      const { error: insertPermError } = await supabase
        .from('user_permissions')
        .insert([masterPermissions]);
        
      if (insertPermError) {
        throw new Error(`Error creating permissions: ${insertPermError.message}`);
      }
    }
    
    console.log("Master permissions set and verified successfully");
    
    // 4. Final verification
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', masterAuthId)
      .single();
      
    if (finalError) {
      throw new Error(`Error in final profile verification: ${finalError.message}`);
    }
    
    console.log("Final profile verification successful:", finalProfile);
    
    return new Response(JSON.stringify({
      success: true,
      message: "Master user initialized successfully",
      user_id: masterAuthId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error initializing master user:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "Error initializing master user"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});
