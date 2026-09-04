'use client';

import { useEffect, useState, useCallback } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

export default function usePaddle() {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox';

    if (!token) {
      console.warn('Paddle client token is missing. Please set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN in .env.local');
      return;
    }

    initializePaddle({
      environment: env as 'sandbox' | 'production',
      token,
    })
      .then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to initialize Paddle SDK:', err);
      });
  }, []);

  const openCheckout = useCallback(
    (options: {
      priceId?: string;
      customAmount?: number;
      customerEmail?: string;
      customerName?: string;
      passthrough?: string;
    }) => {
      if (!paddle) {
        console.error('Paddle SDK is not initialized yet.');
        return false;
      }

      const priceId = options.priceId || process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;

      if (priceId) {
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: options.customerEmail
            ? {
                email: options.customerEmail,
              }
            : undefined,
          customData: {
            supporterName: options.customerName || 'Supporter',
            customAmount: options.customAmount ? String(options.customAmount) : undefined,
            passthrough: options.passthrough || '',
          },
          settings: {
            displayMode: 'overlay',
            theme: 'dark',
            locale: 'en',
          },
        });
        return true;
      }

      return false;
    },
    [paddle]
  );

  return { paddle, isLoaded, openCheckout };
}
