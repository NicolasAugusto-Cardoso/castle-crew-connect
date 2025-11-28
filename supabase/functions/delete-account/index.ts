import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Extract JWT token
    const jwt = authHeader.replace('Bearer ', '');

    // Create client with user JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get authenticated user using JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    if (userError || !user) {
      console.error('Error getting user:', userError);
      throw new Error('Unauthorized');
    }

    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);

    // Create admin client for deletions
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Delete in order to respect foreign key constraints

    // 1. Delete post reactions
    console.log('Deleting post reactions...');
    const { error: reactionsError } = await supabaseAdmin
      .from('post_reactions')
      .delete()
      .eq('user_id', userId);
    if (reactionsError) {
      console.error('Error deleting post_reactions:', reactionsError);
    }

    // 2. Delete post likes
    console.log('Deleting post likes...');
    const { error: likesError } = await supabaseAdmin
      .from('post_likes')
      .delete()
      .eq('user_id', userId);
    if (likesError) {
      console.error('Error deleting post_likes:', likesError);
    }

    // 3. Delete post comments
    console.log('Deleting post comments...');
    const { error: commentsError } = await supabaseAdmin
      .from('post_comments')
      .delete()
      .eq('user_id', userId);
    if (commentsError) {
      console.error('Error deleting post_comments:', commentsError);
    }

    // 4. Delete post images for user's posts
    console.log('Deleting post images...');
    const { data: userPosts } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('author_id', userId);
    
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id);
      const { error: imagesError } = await supabaseAdmin
        .from('post_images')
        .delete()
        .in('post_id', postIds);
      if (imagesError) {
        console.error('Error deleting post_images:', imagesError);
      }
    }

    // 5. Delete posts
    console.log('Deleting posts...');
    const { error: postsError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('author_id', userId);
    if (postsError) {
      console.error('Error deleting posts:', postsError);
    }

    // 6. Delete contact replies
    console.log('Deleting contact replies...');
    const { error: repliesError } = await supabaseAdmin
      .from('contact_replies')
      .delete()
      .eq('sender_id', userId);
    if (repliesError) {
      console.error('Error deleting contact_replies:', repliesError);
    }

    // 7. Delete contact messages
    console.log('Deleting contact messages...');
    const { error: messagesError } = await supabaseAdmin
      .from('contact_messages')
      .delete()
      .eq('user_id', userId);
    if (messagesError) {
      console.error('Error deleting contact_messages:', messagesError);
    }

    // 8. Update discipleship contacts (remove references, don't delete the contacts)
    console.log('Updating discipleship contacts...');
    const { error: discipleshipUpdateError } = await supabaseAdmin
      .from('discipleship_contacts')
      .update({ 
        assigned_collaborator_id: null,
        assigned_by: null 
      })
      .or(`assigned_collaborator_id.eq.${userId},assigned_by.eq.${userId}`);
    if (discipleshipUpdateError) {
      console.error('Error updating discipleship_contacts:', discipleshipUpdateError);
    }

    // Delete discipleship contacts registered by this user
    const { error: discipleshipDeleteError } = await supabaseAdmin
      .from('discipleship_contacts')
      .delete()
      .eq('registered_by', userId);
    if (discipleshipDeleteError) {
      console.error('Error deleting discipleship_contacts:', discipleshipDeleteError);
    }

    // 9. Anonymize testimonials (don't delete, just remove personal info)
    console.log('Anonymizing testimonials...');
    const { error: testimonialsError } = await supabaseAdmin
      .from('testimonials')
      .update({ author_name: null })
      .eq('created_by', userId);
    if (testimonialsError) {
      console.error('Error anonymizing testimonials:', testimonialsError);
    }

    // 10. Delete gallery media
    console.log('Deleting gallery media...');
    const { error: mediaError } = await supabaseAdmin
      .from('gallery_media')
      .delete()
      .eq('created_by', userId);
    if (mediaError) {
      console.error('Error deleting gallery_media:', mediaError);
    }

    // 11. Delete gallery folders
    console.log('Deleting gallery folders...');
    const { error: foldersError } = await supabaseAdmin
      .from('gallery_folders')
      .delete()
      .eq('created_by', userId);
    if (foldersError) {
      console.error('Error deleting gallery_folders:', foldersError);
    }

    // 12. Delete push tokens
    console.log('Deleting push tokens...');
    const { error: tokensError } = await supabaseAdmin
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);
    if (tokensError) {
      console.error('Error deleting push_tokens:', tokensError);
    }

    // 13. Delete collaborator profile
    console.log('Deleting collaborator profile...');
    const { error: collabError } = await supabaseAdmin
      .from('collaborator_profiles')
      .delete()
      .eq('user_id', userId);
    if (collabError) {
      console.error('Error deleting collaborator_profiles:', collabError);
    }

    // 14. Delete user roles
    console.log('Deleting user roles...');
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    if (rolesError) {
      console.error('Error deleting user_roles:', rolesError);
    }

    // 15. Delete profile
    console.log('Deleting profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // 16. Finally, delete auth user
    console.log('Deleting auth user...');
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      throw new Error('Failed to delete authentication user');
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in delete-account function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
