import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { adminFirestore } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userId = req.headers.get('x-user-id');

    if (userId && adminFirestore) {
      const userRef = adminFirestore.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const credits = userDoc.data()?.aiCredits;
      if (credits !== undefined && credits <= 0) {
        return NextResponse.json({ error: 'Out of credits' }, { status: 403 });
      }
    }
    
    // We expect messages to be in the format: { role: 'user' | 'model', parts: [{ text: string }] }
    // Or we can just convert from a simpler format { role: 'user' | 'assistant', content: string }
    
    // Convert to Gemini format
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    
    const latestMessage = messages[messages.length - 1].content;
    
    const systemInstruction = `You are Pinnacle AI, the "Engine of Success". You are an expert academic tutor built for the Pinnacle Academia platform. 
Your goal is to help students prepare for their exams (like JAMB, WAEC, SAT, and school tests).
Provide concise, clear, and encouraging explanations. Do not just give away answers—guide the student to understand the concepts. Use formatting like bolding and bullet points to make your answers easy to read.`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: latestMessage }] }
      ],
      config: {
        systemInstruction,
      }
    });

    // Create a ReadableStream to stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          if (userId && adminFirestore) {
            // Deduct 1 credit after generating the response
            adminFirestore.collection('users').doc(userId).update({
              aiCredits: FieldValue.increment(-1)
            }).catch(console.error);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('Pinnacle AI API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
