import { NextRequest, NextResponse } from 'next/server';
import { Environment, Paddle, EventName } from '@paddle/paddle-node-sdk';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('paddle-signature') || '';
    const secretKey = process.env.PADDLE_WEBHOOK_SECRET || '';

    const apiKey = process.env.PADDLE_API_KEY || 'test_api_key';
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox;

    const paddle = new Paddle(apiKey, { environment: env });

    let event;

    if (secretKey && signature) {
      try {
        event = paddle.webhooks.unmarshal(rawBody, secretKey, signature);
      } catch (err: any) {
        console.error('Invalid Paddle webhook signature:', err.message);
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    } else {
      // Direct parsing fallback when testing in local sandbox before secret key is set
      event = JSON.parse(rawBody);
    }

    const eventType = event.eventType || event.event_type;

    switch (eventType) {
      case EventName.TransactionCompleted:
      case 'transaction.completed': {
        const transactionData = event.data;
        console.log('✅ Paddle Transaction Completed:', {
          id: transactionData.id,
          status: transactionData.status,
          customData: transactionData.customData || transactionData.custom_data,
          details: transactionData.details,
        });
        break;
      }

      case EventName.SubscriptionCreated:
      case 'subscription.created': {
        console.log('🎉 Paddle Subscription Created:', event.data.id);
        break;
      }

      default:
        console.log(`Unhandled Paddle Event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Paddle webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
