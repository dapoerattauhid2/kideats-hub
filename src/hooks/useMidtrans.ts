import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: any) => void;
          onPending: (result: any) => void;
          onError: (result: any) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}

export function useMidtrans() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clientKey, setClientKey] = useState<string | null>(null);

  useEffect(() => {
    const loadMidtrans = async () => {
      try {
        // Fetch client key from edge function
        const { data, error } = await supabase.functions.invoke('get-midtrans-config');
        
        if (error) {
          console.error('Failed to fetch Midtrans config:', error);
          setIsLoading(false);
          return;
        }

        const { clientKey: key, isProduction } = data;
        setClientKey(key);

        // Check if script already loaded
        if (window.snap) {
          setIsReady(true);
          setIsLoading(false);
          return;
        }

        // Load Midtrans Snap.js
        const script = document.createElement('script');
        script.src = isProduction 
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', key);
        script.async = true;

        script.onload = () => {
          setIsReady(true);
          setIsLoading(false);
        };

        script.onerror = () => {
          console.error('Failed to load Midtrans Snap.js');
          setIsLoading(false);
        };

        document.body.appendChild(script);
      } catch (err) {
        console.error('Error loading Midtrans:', err);
        setIsLoading(false);
      }
    };

    loadMidtrans();
  }, []);

  const pay = useCallback(
    (
      token: string,
      callbacks: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }
    ) => {
      if (!isReady || !window.snap) {
        console.error('Midtrans Snap.js is not ready');
        return;
      }

      window.snap.pay(token, {
        onSuccess: (result) => {
          console.log('Payment success:', result);
          callbacks.onSuccess?.(result);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          callbacks.onPending?.(result);
        },
        onError: (result) => {
          console.error('Payment error:', result);
          callbacks.onError?.(result);
        },
        onClose: () => {
          console.log('Payment popup closed');
          callbacks.onClose?.();
        },
      });
    },
    [isReady]
  );

  return { isReady, isLoading, pay, clientKey };
}
