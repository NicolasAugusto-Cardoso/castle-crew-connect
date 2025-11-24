import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) {
      return;
    }

    const registerPush = async () => {
      try {
        // Solicitar permissão
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
          await PushNotifications.register();
        } else {
          console.log('Push notification permission denied');
        }
      } catch (error) {
        console.error('Error requesting push permissions:', error);
      }
    };

    // Listener para quando o token é registrado
    let registrationListener: any;
    let errorListener: any;
    let notificationListener: any;
    let actionListener: any;

    const setupListeners = async () => {
      registrationListener = await PushNotifications.addListener(
        'registration',
        async (token) => {
          console.log('Push registration success, token:', token.value);
          
          try {
            // Salvar token no Supabase
            const { error } = await supabase
              .from('push_tokens')
              .upsert({
                user_id: userId,
                token: token.value,
                platform: Capacitor.getPlatform(),
              }, {
                onConflict: 'user_id,token'
              });

            if (error) {
              console.error('Error saving push token:', error);
            } else {
              console.log('Push token saved successfully');
            }
          } catch (error) {
            console.error('Error in push token registration:', error);
          }
        }
      );

      // Listener para erro de registro
      errorListener = await PushNotifications.addListener(
        'registrationError',
        (error) => {
          console.error('Push registration error:', error);
        }
      );

      // Listener para notificações recebidas quando o app está aberto
      notificationListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('Push notification received:', notification);
          
          // Mostrar toast quando notificação chegar com app aberto
          toast({
            title: notification.title || 'Nova notificação',
            description: notification.body,
            duration: 5000,
          });
        }
      );

      // Listener para quando usuário toca na notificação
      actionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log('Push notification action performed:', notification);
          
          // Aqui você pode navegar para a tela relevante
          // Por exemplo: se notification.data.message_id, navegar para /contact
        }
      );
    };

    setupListeners();

    // Cleanup
    return () => {
      if (registrationListener) registrationListener.remove();
      if (errorListener) errorListener.remove();
      if (notificationListener) notificationListener.remove();
      if (actionListener) actionListener.remove();
    };
  }, [userId]);
};
