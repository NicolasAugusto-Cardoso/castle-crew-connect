import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, body, data } = await req.json() as PushNotificationRequest;

    console.log('Sending push notification to user:', user_id);

    // Buscar tokens do usuário
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user:', user_id);
      return new Response(
        JSON.stringify({ message: 'No push tokens found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${tokens.length} tokens for user ${user_id}`);

    // Aqui você integraria com FCM (Firebase Cloud Messaging) ou APNs (Apple Push Notification service)
    // Por enquanto, apenas logamos
    const notifications = tokens.map(token => ({
      to: token.token,
      title,
      body,
      data,
      platform: token.platform
    }));

    console.log('Notifications to send:', notifications);

    // TODO: Integrar com FCM/APNs
    // Exemplo com FCM:
    // const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    // for (const notification of notifications.filter(n => n.platform === 'android')) {
    //   await fetch('https://fcm.googleapis.com/fcm/send', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `key=${fcmServerKey}`
    //     },
    //     body: JSON.stringify({
    //       to: notification.to,
    //       notification: { title: notification.title, body: notification.body },
    //       data: notification.data
    //     })
    //   });
    // }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notifications queued for ${tokens.length} device(s)`,
        tokens_found: tokens.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});