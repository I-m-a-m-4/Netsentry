'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, User, Loader2, Plus, MessageSquare, CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, query, where, orderBy, onSnapshot, setDoc, addDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AIChat = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: any;
};

export default function PinnacleAIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm **Pinnacle AI**, your Engine of Success. How can I help you ace your studies today?",
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<AIChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [aiCredits, setAiCredits] = useState<number>(20);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  // Load User Credits
  useEffect(() => {
    if (!user) return;
    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.aiCredits !== undefined) {
          setAiCredits(data.aiCredits);
        } else {
          updateDoc(userRef, { aiCredits: 20 });
        }
      }
    });
    return () => unsubscribe();
  }, [user, firestore]);

  // Load Chats History
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'users', user.uid, 'aiChats'),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIChat[];
      setChats(loadedChats);
    });
    return () => unsubscribe();
  }, [user, firestore]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const loadChat = (chat: AIChat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
  };

  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm **Pinnacle AI**, your Engine of Success. Let's start a new topic!",
      }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (aiCredits <= 0) {
      toast({ title: 'Out of credits', description: 'Please top up your AI credits to continue.', variant: 'destructive' });
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: 'user', content: userMessage }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/pinnacle-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.uid || '',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        if (response.status === 403) {
            setAiCredits(0);
            throw new Error("Out of credits");
        }
        throw new Error(response.statusText);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No reader available');

      let assistantMessage = '';
      const assistantId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        
        setMessages(prev => {
          const newMsg = [...prev];
          newMsg[newMsg.length - 1].content = assistantMessage;
          return newMsg;
        });
      }

      setAiCredits(prev => Math.max(0, prev - 1));

      if (user) {
        const finalMessages = [
          ...newMessages,
          { id: assistantId, role: 'assistant' as const, content: assistantMessage }
        ];

        let targetChatId = currentChatId;
        if (!targetChatId) {
           const chatRef = await addDoc(collection(firestore, 'users', user.uid, 'aiChats'), {
             title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
             messages: finalMessages,
             updatedAt: serverTimestamp(),
           });
           setCurrentChatId(chatRef.id);
        } else {
           await updateDoc(doc(firestore, 'users', user.uid, 'aiChats', targetChatId), {
             messages: finalMessages,
             updatedAt: serverTimestamp(),
           });
        }
      }

    } catch (error: any) {
      console.error('Failed to get response:', error);
      if (error.message !== "Out of credits") {
         setMessages(prev => [
           ...prev, 
           { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
         ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isOutOfCredits = aiCredits <= 0;

  return (
    <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-white/10 bg-background shadow-2xl relative z-10 mx-auto max-w-7xl">
        {/* Left Sidebar - History */}
        <div className="w-80 border-r border-white/5 bg-muted/20 flex flex-col hidden md:flex">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/20 p-2 rounded-full">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="font-bold tracking-tight">Pinnacle AI</h2>
                </div>
            </div>
            
            <div className="p-4">
                <Button onClick={createNewChat} className="w-full justify-start gap-2 h-10" variant="outline">
                    <Plus className="h-4 w-4" /> New Study Session
                </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2">
                <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent History</div>
                {chats.length === 0 ? (
                    <div className="px-2 py-4 text-xs text-muted-foreground text-center italic">No saved sessions yet.</div>
                ) : (
                    chats.map(chat => (
                        <Button
                            key={chat.id}
                            variant="ghost"
                            className={`w-full justify-start text-left px-2 py-6 mb-1 h-auto font-normal ${currentChatId === chat.id ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground'}`}
                            onClick={() => loadChat(chat)}
                        >
                            <MessageSquare className="h-4 w-4 mr-3 shrink-0 opacity-70" />
                            <div className="truncate text-sm flex-1">{chat.title}</div>
                        </Button>
                    ))
                )}
            </div>
            
            <div className="p-4 border-t border-white/5 bg-background/50">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-4 w-4" /> Credits Remaining
                    </div>
                    <div className={`font-bold ${isOutOfCredits ? 'text-destructive' : 'text-primary'}`}>
                        {aiCredits}
                    </div>
                </div>
                {isOutOfCredits && (
                    <Button size="sm" className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700 text-white">
                        <Lock className="h-3 w-3 mr-2" /> Top Up Credits
                    </Button>
                )}
            </div>
        </div>

        {/* Right Area - Chat */}
        <div className="flex-1 flex flex-col relative">
            {/* Mobile Header */}
            <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="font-bold">Pinnacle AI</h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-background px-3 py-1.5 rounded-full border border-white/10">
                    <CreditCard className="h-3 w-3 text-primary" /> {aiCredits}
                </div>
            </div>

            <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
                <div className="max-w-3xl mx-auto space-y-6 pb-20">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-primary/20 bg-primary/5">
                                    <AvatarImage src="/bot-avatar.png" />
                                    <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                                </Avatar>
                            )}
                            
                            <div className={`rounded-2xl px-4 md:px-6 py-3 max-w-[85%] md:max-w-[75%] ${
                                msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                : 'bg-muted/50 border border-white/5 rounded-tl-sm text-foreground'
                            }`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                            
                            {msg.role === 'user' && (
                                <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-white/10">
                                    <AvatarImage src={user?.photoURL || ''} />
                                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 justify-start">
                            <Avatar className="h-10 w-10 border border-primary/20 bg-primary/5">
                                <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                            </Avatar>
                            <div className="bg-muted/50 border border-white/5 rounded-2xl rounded-tl-sm px-6 py-4 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 bg-background/80 backdrop-blur-md border-t border-white/5 absolute bottom-0 left-0 right-0">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            placeholder={isOutOfCredits ? "Out of credits..." : "Ask me anything about your studies..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading || isOutOfCredits}
                            className="bg-muted/50 border-white/10 focus-visible:ring-primary/50 rounded-full h-12 px-6"
                        />
                        <Button 
                            type="submit" 
                            disabled={isLoading || !input.trim() || isOutOfCredits}
                            size="icon"
                            className="h-12 w-12 rounded-full shrink-0 shadow-lg hover:shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground mt-3 tracking-wide">
                        Pinnacle AI can make mistakes. Verify important academic information.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}
