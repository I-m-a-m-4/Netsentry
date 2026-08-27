
import { NextRequest, NextResponse } from 'next/server';

const DODO_API_KEY = process.env.DODO_SECRET_KEY;
const DODO_MODE = process.env.NEXT_PUBLIC_DODO_MODE === 'live' ? 'live' : 'test';
const DODO_API_URL = `https://${DODO_MODE}.dodopayments.com/checkouts`;

// Replace these with your actual Dodo Subject IDs from the dashboard
const DODO_PRODUCT_IDS: Record<string, string> = {
  'pro': process.env.DODO_PRO_PRODUCT_ID || 'pdp_pro_placeholder',
  'academy': process.env.DODO_BUSINESS_PRODUCT_ID || 'pdp_business_placeholder',
};

export async function POST(req: NextRequest) {
  try {
    const { planId, email, academyId, cycleMonths } = await req.json();
    console.log('Dodo Checkout Request:', { planId, email, academyId, cycleMonths });

    if (!DODO_API_KEY) {
      console.error('Dodo API key is missing from environment variables');
      return NextResponse.json({ error: 'Dodo API key not configured' }, { status: 500 });
    }

    const subjectId = DODO_PRODUCT_IDS[planId];
    console.log('Target Subject ID:', subjectId);

    if (!subjectId || subjectId.includes('placeholder')) {
      console.error('Dodo Subject ID not configured for plan:', planId);
      return NextResponse.json({ error: 'Dodo Subject ID not configured for this plan' }, { status: 400 });
    }

    const body = {
      product_cart: [
        {
          product_id: subjectId,
          quantity: 1,
        },
      ],
      customer: {
        email: email,
      },
      metadata: {
        academyId: academyId,
        planId: planId,
        cycleMonths: cycleMonths.toString(),
      },
      billing_currency: 'USD',
    };

    console.log('Dodo API Request Body:', JSON.stringify(body, null, 2));

    // Create Checkout Session
    const response = await fetch(DODO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DODO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Dodo API Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Dodo API Error Response:', data);
      return NextResponse.json({ 
        error: data.message || 'Failed to create Dodo checkout session',
        details: data
      }, { status: response.status });
    }

    return NextResponse.json({ checkout_url: data.checkout_url });
  } catch (error: any) {
    console.error('Internal Dodo Checkout Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message 
    }, { status: 500 });
  }
}
