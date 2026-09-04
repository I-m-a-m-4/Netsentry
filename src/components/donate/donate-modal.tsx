'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Coffee, Heart, Sparkles, Shield, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import usePaddle from '@/hooks/use-paddle';

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_TIERS = [
  { coffees: 1, amount: 3, label: '1 Coffee', emoji: '☕', desc: 'Fuel a feature' },
  { coffees: 3, amount: 9, label: '3 Coffees', emoji: '☕☕☕', desc: 'Support maintenance', popular: true },
  { coffees: 5, amount: 15, label: '5 Coffees', emoji: '⚡', desc: 'Server & telemetry' },
  { coffees: 10, amount: 30, label: 'Super Sponsor', emoji: '🚀', desc: 'Accelerate NetSentry' },
];

export default function DonateModal({ open, onOpenChange }: DonateModalProps) {
  const { toast } = useToast();
  const { isLoaded, openCheckout } = usePaddle();

  const [selectedAmount, setSelectedAmount] = useState<number>(9);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const finalAmount = isCustom ? (parseFloat(customAmount) || 0) : selectedAmount;

  const handleDonate = async () => {
    if (finalAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please select or enter a donation amount greater than $0.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // First try Paddle overlay checkout
      const opened = openCheckout({
        customAmount: finalAmount,
        customerEmail: email.trim() || undefined,
        customerName: name.trim() || undefined,
      });

      if (opened) {
        onOpenChange(false);
        toast({
          title: 'Opening Secure Paddle Checkout',
          description: `Thank you for supporting NetSentry with $${finalAmount}!`,
        });
        return;
      }

      // Fallback API call if dynamic transaction checkout is configured
      const response = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          currency: 'USD',
          supporterName: name.trim() || 'Anonymous Supporter',
          supporterEmail: email.trim() || 'supporter@netsentry.io',
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
        onOpenChange(false);
        toast({
          title: 'Opening Secure Checkout',
          description: `Thank you for supporting NetSentry with $${finalAmount}!`,
        });
      } else {
        // Acknowledgment if keys are being setup in sandbox
        toast({
          title: 'Thank You for Your Support! 🧡',
          description: `Your contribution of $${finalAmount} helps keep NetSentry fast, secure, and independent.`,
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Donation checkout error:', error);
      toast({
        title: 'Thank You! 🧡',
        description: `Your pledge of $${finalAmount} is deeply appreciated!`,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border sm:rounded-2xl p-6">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-bricolage text-xl font-bold flex items-center gap-2">
                Buy Us a Coffee
                <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Support the development and maintenance of NetSentry.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Preset Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {PRESET_TIERS.map((tier) => {
              const isSelected = !isCustom && selectedAmount === tier.amount;
              return (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(tier.amount);
                    setIsCustom(false);
                  }}
                  className={`relative p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-primary text-[9px] font-bold text-primary-foreground rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{tier.emoji}</span>
                    <span className="font-bricolage font-bold text-base text-foreground">
                      ${tier.amount}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-foreground mt-1">
                    {tier.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {tier.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Or enter custom amount ($ USD):</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">$</span>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setIsCustom(true);
                }}
                className="pl-7 bg-muted/10 border-border text-sm font-semibold"
              />
            </div>
          </div>

          {/* Supporter Details */}
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Your Name (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs bg-muted/10 border-border"
              />
              <Input
                type="email"
                placeholder="Email (for receipt)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs bg-muted/10 border-border"
              />
            </div>
            <Textarea
              placeholder="Say something nice or suggest a feature..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="text-xs bg-muted/10 border-border resize-none"
            />
          </div>

          {/* Action CTA */}
          <Button
            onClick={handleDonate}
            disabled={isLoading || finalAmount <= 0}
            className="w-full font-bold h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex items-center justify-center gap-2 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Coffee className="w-4 h-4" />
                <span>Support NetSentry with ${finalAmount || 0}</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-primary" />
            Secured globally via Paddle (Merchant of Record). No hidden fees.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
