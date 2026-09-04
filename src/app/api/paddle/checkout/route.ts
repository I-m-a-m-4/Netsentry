import { NextRequest, NextResponse } from 'next/server';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USD', supporterName, supporterEmail, priceId } = await req.json();

    const apiKey = process.env.PADDLE_API_KEY;
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PADDLE_API_KEY is not configured in server environment.' },
        { status: 400 }
      );
    }

    const paddle = new Paddle(apiKey, { environment: env });

    const targetPriceId = priceId || process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;

    if (!targetPriceId) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_PADDLE_PRICE_ID is not configured.' },
        { status: 400 }
      );
    }

    // Create Paddle Transaction
    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId: targetPriceId,
          quantity: 1,
        },
      ],
      customData: {
        supporterName: supporterName || 'Anonymous Supporter',
        supporterEmail: supporterEmail || '',
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      checkoutUrl: (transaction as any).url || null,
    });
  } catch (error: any) {
    console.error('Error creating Paddle transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Paddle transaction' },
      { status: 500 }
    );
  }
}
