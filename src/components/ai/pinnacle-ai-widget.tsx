'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, User, Loader2, Maximize2, Minimize2, Plus, MessageSquare, CreditCard, Lock } from 'lucide-react';
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

export function PinnacleAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
          // Initialize with 20 credits if missing
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
    if (!isExpanded) setIsExpanded(true);
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

      // Decrement local credit blindly, server does it too
      setAiCredits(prev => Math.max(0, prev - 1));

      // Save to history
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
           { id: Date.now().toString(), role: 'assistant', content: 'Oops! I encountered an error. Please try again later.' }
         ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 origin-bottom-right"
          >
            <Card className={`flex overflow-hidden shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 ${isExpanded ? 'w-[90vw] md:w-[800px] h-[80vh] flex-row' : 'w-[350px] sm:w-[400px] h-[500px] flex-col'}` }>
              
              {/* Sidebar (Only visible when expanded) */}
              {isExpanded && (
                <div className="w-[250px] border-r border-border/50 bg-muted/20 flex flex-col hidden md:flex">
                  <div className="p-4 border-b border-border/50">
                    <Button onClick={createNewChat} className="w-full justify-start gap-2" variant="outline">
                      <Plus size={16} /> New Chat
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 p-2">
                    <div className="flex flex-col gap-1">
                      {chats.map(chat => (
                        <Button
                          key={chat.id}
                          variant={currentChatId === chat.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-left truncate font-normal text-sm"
                          onClick={() => loadChat(chat)}
                        >
                          <MessageSquare size={14} className="mr-2 shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b pb-3 pt-4 px-4 flex flex-row justify-between items-center space-y-0 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-sm">
                      <Bot size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-md font-bold flex items-center gap-1">
                        Pinnacle AI <Sparkles className="w-3 h-3 text-amber-500" />
                      </CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Engine of Success 
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${aiCredits > 0 ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                          {aiCredits} Credits
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsExpanded(!isExpanded)}>
                      {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                      <X size={16} />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                  <ScrollArea className="h-full px-4 py-4" ref={scrollRef}>
                    <div className="flex flex-col gap-4 pb-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[85%] ${
                            msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                          }`}
                        >
                          <Avatar className="w-8 h-8 border shadow-sm">
                            {msg.role === 'assistant' ? (
                              <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={14}/></AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={user?.photoURL || ''} />
                                <AvatarFallback className="bg-muted"><User size={14}/></AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-muted/60 border rounded-tl-sm'
                            }`}
                          >
                            <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} prose-p:leading-relaxed prose-pre:bg-black/10 prose-pre:text-foreground`}>
                              {msg.role === 'user' ? (
                                msg.content
                              ) : (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 max-w-[85%] mr-auto">
                          <Avatar className="w-8 h-8 border shadow-sm">
                            <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={14}/></AvatarFallback>
                          </Avatar>
                          <div className="rounded-2xl px-4 py-3 text-sm bg-muted/60 border rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  {/* Paywall Overlay */}
                  {aiCredits <= 0 && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="bg-card p-6 rounded-2xl shadow-xl border max-w-sm">
                        <div className="mx-auto w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                          <Lock size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Out of AI Credits</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          You've used all your free Pinnacle AI credits. Top up your balance to continue acing your exams!
                        </p>
                        <Button className="w-full gap-2" onClick={() => toast({ title: "Coming Soon", description: "Payment gateway integration is pending." })}>
                          <CreditCard size={16} /> Top Up Now
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-3 border-t bg-background/50 shrink-0">
                  <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 relative">
                    <Input
                      placeholder={aiCredits > 0 ? "Ask Pinnacle AI..." : "Out of credits..."}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading || aiCredits <= 0}
                      className="pr-10 rounded-full bg-muted/50 border-muted focus-visible:ring-primary/50"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isLoading || aiCredits <= 0}
                      className="absolute right-1 w-8 h-8 rounded-full"
                    >
                      <Send size={14} className={input.trim() ? "ml-0.5" : ""} />
                    </Button>
                  </form>
                </CardFooter>
              </div>

            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center border-2 border-primary-foreground/20 hover:shadow-xl transition-shadow relative overflow-hidden group"
      >
        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        {isOpen ? (
          <X size={24} className="relative z-10" />
        ) : (
          <Bot size={24} className="relative z-10" />
        )}
      </motion.button>
    </div>
  );
}
