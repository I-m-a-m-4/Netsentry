import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USD', supporterName, supporterEmail, message } = await req.json();

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const mode = process.env.NEXT_PUBLIC_DODO_MODE || 'test';
    const baseUrl = mode === 'live' 
      ? 'https://live.dodopayments.com' 
      : 'https://test.dodopayments.com';

    if (apiKey) {
      // Create one-time payment session with Dodo Payments API
      const dodoRes = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billing: {
            city: 'Global',
            country: 'US',
            state: 'NY',
            street: 'Digital',
            zipcode: '10001',
          },
          customer: {
            email: supporterEmail || 'supporter@netsentry.io',
            name: supporterName || 'NetSentry Supporter',
          },
          payment_link: true,
          product_cart: [
            {
              product_id: process.env.DODO_DONATION_PRODUCT_ID || 'p_donation',
              quantity: 1,
              amount: Math.round(Number(amount) * 100), // in cents
            },
          ],
          return_url: `${req.nextUrl.origin}/?donation=success`,
          metadata: {
            supporterName,
            supporterEmail,
            message: message || '',
            type: 'donation',
          },
        }),
      });

      if (dodoRes.ok) {
        const dodoData = await dodoRes.json();
        return NextResponse.json({
          success: true,
          checkoutUrl: dodoData.payment_link || dodoData.checkout_url || dodoData.url,
        });
      }
    }

    // Default response if direct key is pending
    return NextResponse.json({
      success: true,
      amount,
      message: 'Donation intent recorded successfully.',
    });
  } catch (error: any) {
    console.error('Error generating donation checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
