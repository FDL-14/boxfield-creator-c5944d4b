
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
    // Obtenha as variáveis de ambiente do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    
    // Verificação simplificada - apenas avisa se as variáveis não estão disponíveis
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Environment variables missing: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    
    // Cria o cliente Supabase com as credenciais de serviço
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get the request body
    const requestData = await req.json()
    const { cpf } = requestData

    if (!cpf) {
      return new Response(
        JSON.stringify({ error: 'CPF is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Clean CPF (remove non-numeric characters)
    const cleanCpf = cpf.replace(/\D/g, '')

    // Check if this is the master CPF
    const isMasterCpf = cleanCpf === '80243088191'

    // Find user by CPF
    const { data: users, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, cpf')
      .eq('cpf', cleanCpf)
      .limit(1)

    if (findError) {
      console.error('Error finding user:', findError)
      return new Response(
        JSON.stringify({ error: 'Error finding user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If it's the master CPF but no user found, create a master user
    if (isMasterCpf && (!users || users.length === 0)) {
      // Create master user if not exists
      const masterEmail = 'fabiano@totalseguranca.net'
      const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: masterEmail,
        password: 'MasterCPF80243088191',
        email_confirm: true,
        user_metadata: {
          name: 'Usuário Master',
          cpf: cleanCpf,
        }
      })

      if (createUserError) {
        console.error('Error creating master user:', createUserError)
        return new Response(
          JSON.stringify({ error: 'Error creating master user' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Try to sign in the newly created master user
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: masterEmail,
        password: 'MasterCPF80243088191',
      })

      if (signInError) {
        console.error('Error signing in master user:', signInError)
        return new Response(
          JSON.stringify({ error: 'Error signing in master user' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify(signInData),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else if (isMasterCpf) {
      // For master CPF, ensure the user account is confirmed
      const masterUser = users[0]
      const masterEmail = masterUser.email || 'fabiano@totalseguranca.net'

      // Get the auth user
      const { data: authUserData } = await supabaseAdmin
        .from('auth.users')
        .select('id, email, email_confirmed_at')
        .eq('id', masterUser.id)
        .single()

      // If email is not confirmed, update it
      if (!authUserData?.email_confirmed_at) {
        // Update user to make sure email is confirmed
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          masterUser.id,
          { email_confirm: true }
        )

        if (updateError) {
          console.error('Error updating master user:', updateError)
        }
      }

      // Try to sign in with the user's email
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: masterEmail,
        password: 'MasterCPF80243088191',
      })

      if (signInError) {
        // If sign in fails, reset the password and try again
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
          masterUser.id,
          { password: 'MasterCPF80243088191' }
        )

        if (resetError) {
          console.error('Error resetting master user password:', resetError)
          return new Response(
            JSON.stringify({ error: 'Error authenticating master user' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Try signing in again
        const { data: retrySignInData, error: retrySignInError } = await supabaseAdmin.auth.signInWithPassword({
          email: masterEmail,
          password: 'MasterCPF80243088191',
        })

        if (retrySignInError) {
          console.error('Error signing in master user after reset:', retrySignInError)
          return new Response(
            JSON.stringify({ error: 'Error authenticating master user' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify(retrySignInData),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify(signInData),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Regular user process (non-master)
    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found with this CPF' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const user = users[0]
    if (!user.email) {
      return new Response(
        JSON.stringify({ error: 'User email is missing' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate a magic link for the user
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError)
      return new Response(
        JSON.stringify({ error: 'Error generating authentication link' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          cpf: user.cpf,
        },
        magicLink: magicLinkData,
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
