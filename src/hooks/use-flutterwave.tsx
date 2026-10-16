'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export interface FlutterwaveCustomer {
  email: string;
  phone_number?: string;
  name?: string;
}

export interface FlutterwaveCustomizations {
  title?: string;
  description?: string;
  logo?: string;
}

export interface FlutterwaveHookConfig {
  public_key?: string;
  tx_ref?: string;
  amount: number;
  currency?: string;
  payment_options?: string;
  customer: FlutterwaveCustomer;
  customizations?: FlutterwaveCustomizations;
  onSuccess: (response: any) => void;
  onClose: (incomplete?: boolean) => void;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: any) => void;
  }
}

const FLUTTERWAVE_SCRIPT_URL = 'https://checkout.flutterwave.com/v3.js';
const SCRIPT_ID = 'flutterwave-checkout-sdk';

let scriptPromise: Promise<void> | null = null;

export const useFlutterwave = () => {
  const { toast } = useToast();
  const [isSdkReady, setIsSdkReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.FlutterwaveCheckout) {
      setIsSdkReady(true);
      return;
    }

    if (scriptPromise) {
      scriptPromise
        .then(() => setIsSdkReady(true))
        .catch(() => setIsSdkReady(false));
      return;
    }

    scriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setIsSdkReady(true);
          resolve();
        });
        existingScript.addEventListener('error', (e) => {
          console.error('Flutterwave SDK failed to load.', e);
          scriptPromise = null;
          reject(e);
        });
        return;
      }

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = FLUTTERWAVE_SCRIPT_URL;
      script.async = true;

      script.onload = () => {
        setIsSdkReady(true);
        resolve();
      };

      script.onerror = (e) => {
        console.error('Flutterwave SDK failed to load.', e);
        toast({
          variant: 'destructive',
          title: 'Payment Gateway Error',
          description: 'Could not load Flutterwave SDK. Please check your internet connection.',
          duration: 8000
        });
        scriptPromise = null;
        document.getElementById(SCRIPT_ID)?.remove();
        reject(new Error('Flutterwave SDK failed to load.'));
      };

      document.body.appendChild(script);
    });
  }, [toast]);

  const initializePayment = useCallback((config: FlutterwaveHookConfig) => {
    const launchCheckout = () => {
      const publicKey = config.public_key || 
        process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 
        'FLWPUBK_TEST-SANDBOXDEMOKEY-X';

      const txRef = config.tx_ref || `nethelm_coffee_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

      window.FlutterwaveCheckout!({
        public_key: publicKey,
        tx_ref: txRef,
        amount: config.amount,
        currency: config.currency || 'NGN',
        payment_options: config.payment_options || 'card,banktransfer,ussd,mobilemoney',
        customer: config.customer,
        customizations: config.customizations || {
          title: 'Buy Us a Coffee',
          description: 'Support NetHelm / NetSentry Development',
          logo: 'https://netsentry-psi.vercel.app/app-icon.svg',
        },
        callback: (response: any) => {
          if (config.onSuccess) {
            config.onSuccess(response);
          }
        },
        onclose: (incomplete?: boolean) => {
          if (config.onClose) {
            config.onClose(incomplete);
          }
        }
      });
    };

    if (typeof window !== 'undefined' && window.FlutterwaveCheckout) {
      try {
        launchCheckout();
      } catch (err: any) {
        console.error('Flutterwave payment initialization error:', err);
        toast({
          variant: 'destructive',
          title: 'Checkout Error',
          description: 'Failed to launch Flutterwave payment modal. Please try again.'
        });
      }
      return;
    }

    // Quick retry after short interval if script was loading
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.FlutterwaveCheckout) {
        try {
          launchCheckout();
        } catch (err: any) {
          console.error('Flutterwave payment error on retry:', err);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Payment Gateway Loading',
          description: 'Flutterwave gateway is still initializing. Please wait a second or switch to Paystack.'
        });
      }
    }, 600);
  }, [toast]);

  return { initializePayment, isScriptLoaded: isSdkReady };
};

export default useFlutterwave;
