import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !roles?.some(r => r.role === 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem excluir usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { userId } = await req.json();

    // Validate input
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Você não pode excluir sua própria conta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete related records first to avoid foreign key constraints
    console.log(`Starting deletion process for user: ${userId}`);

    // 1. Delete post reactions
    console.log('Deleting post_reactions...');
    await supabaseAdmin
      .from('post_reactions')
      .delete()
      .eq('user_id', userId);

    // 2. Delete post likes
    console.log('Deleting post_likes...');
    await supabaseAdmin
      .from('post_likes')
      .delete()
      .eq('user_id', userId);

    // 3. Delete post comments
    console.log('Deleting post_comments...');
    await supabaseAdmin
      .from('post_comments')
      .delete()
      .eq('user_id', userId);

    // 4. Delete posts and associated images
    console.log('Deleting posts and post_images...');
    const { data: userPosts } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('author_id', userId);
    
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id);
      await supabaseAdmin
        .from('post_images')
        .delete()
        .in('post_id', postIds);
    }
    
    await supabaseAdmin
      .from('posts')
      .delete()
      .eq('author_id', userId);

    // 5. Delete contact replies
    console.log('Deleting contact_replies...');
    await supabaseAdmin
      .from('contact_replies')
      .delete()
      .eq('sender_id', userId);

    // 6. Delete contact messages
    console.log('Deleting contact_messages...');
    await supabaseAdmin
      .from('contact_messages')
      .delete()
      .eq('user_id', userId);

    // 7. Update discipleship_contacts (set NULL for references, delete where registered_by)
    console.log('Updating discipleship_contacts...');
    await supabaseAdmin
      .from('discipleship_contacts')
      .update({ assigned_collaborator_id: null, assigned_by: null })
      .eq('assigned_collaborator_id', userId);
    
    await supabaseAdmin
      .from('discipleship_contacts')
      .update({ assigned_by: null })
      .eq('assigned_by', userId);
    
    await supabaseAdmin
      .from('discipleship_contacts')
      .delete()
      .eq('registered_by', userId);

    // 8. Delete gallery media
    console.log('Deleting gallery_media...');
    await supabaseAdmin
      .from('gallery_media')
      .delete()
      .eq('created_by', userId);

    // 9. Delete gallery folders
    console.log('Deleting gallery_folders...');
    await supabaseAdmin
      .from('gallery_folders')
      .delete()
      .eq('created_by', userId);

    // 10. Delete testimonials
    console.log('Deleting testimonials...');
    await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('created_by', userId);

    // 11. Delete push tokens
    console.log('Deleting push_tokens...');
    await supabaseAdmin
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);

    // 12. Delete collaborator profile (if exists)
    console.log('Deleting collaborator_profiles...');
    await supabaseAdmin
      .from('collaborator_profiles')
      .delete()
      .eq('user_id', userId);

    // 13. Delete user roles
    console.log('Deleting user_roles...');
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // 14. Delete profile
    console.log('Deleting profiles...');
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 15. Finally, delete user from auth
    console.log('Deleting user from auth...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir usuário: ' + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
