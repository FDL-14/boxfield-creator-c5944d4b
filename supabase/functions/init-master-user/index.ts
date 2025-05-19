
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from the request context
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if the user is a master user (by CPF, email or flag)
    const masterCPF = '80243088191'
    const masterEmail = 'fabiano@totalseguranca.net'

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('cpf, email, is_master')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if this is the master user
    const userCPF = profile?.cpf?.replace(/\D/g, '')
    const isMasterByEmail = profile?.email === masterEmail || user.email === masterEmail
    const isMasterByCPF = userCPF === masterCPF
    const isMasterByFlag = profile?.is_master === true

    if (!isMasterByEmail && !isMasterByCPF && !isMasterByFlag) {
      return new Response(
        JSON.stringify({ error: 'Only the master user can call this function' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update user profile to set master and admin flags
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_master: true,
        is_admin: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update master user profile' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Make sure email is confirmed
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        email_confirm: true,
        user_metadata: {
          is_master: true,
          is_admin: true
        } 
      }
    )

    if (confirmError) {
      return new Response(
        JSON.stringify({ error: 'Failed to confirm master user email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create user permissions if not exist
    const { data: existingPermissions } = await supabaseAdmin
      .from('user_permissions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existingPermissions) {
      const { error: permError } = await supabaseAdmin
        .from('user_permissions')
        .insert([{
          user_id: user.id,
          can_create: true,
          can_edit: true,
          can_delete: true,
          can_mark_complete: true,
          can_mark_delayed: true,
          can_add_notes: true,
          can_view_reports: true,
          view_all_actions: true,
          can_edit_user: true,
          can_edit_action: true,
          can_edit_client: true,
          can_delete_client: true,
          can_edit_company: true,
          can_delete_company: true,
          can_edit_document_type: true,
        }])

      if (permError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create master user permissions' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Master user initialized successfully',
        user: {
          id: user.id,
          email: user.email,
          is_master: true,
          is_admin: true
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
