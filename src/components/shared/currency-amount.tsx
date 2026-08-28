import React from 'react';

export function CurrencyAmount({ 
  amount, 
  currency = 'NGN', 
  className 
}: { 
  amount: number; 
  currency?: string; 
  className?: string; 
}) {
  const symbol = currency === 'USD' ? '$' : '₦';
  return (
    <span className={className}>
      {symbol}{Math.round(amount || 0).toLocaleString()}
    </span>
  );
}
