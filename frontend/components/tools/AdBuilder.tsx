import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';
import ChatLayout, { ChatMessage } from './ChatLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';
import { useBackend } from '@/lib/useBackend';

export default function AdBuilder() {
  useCompleteScrollToTop();

  const backend = useBackend();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const initialPrompts = [
    "Iniciar"
  ];

  const generateAdResponse = async (userMessage: string): Promise<{ result: string; threadId: string }> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    
    try {
      const response = await backend.hub.generateResponse({ 
        prompt: userMessage,
        assistantId: "asst_29I3591Ig7wEo9Akjtdzpmxy",
        threadId: threadId || undefined
      });
      
      clearTimeout(timeout);
      
      if (!response || !response.result) {
        throw new Error("Resposta vazia da API");
      }
      
      return { result: response.result, threadId: response.threadId };
    } catch (error) {
      clearTimeout(timeout);
      console.error("Erro ao chamar OpenAI API:", error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("A conexão com a IA expirou. Tente novamente.");
      }
      
      throw new Error("Não foi possível conectar à IA no momento. Tente novamente em instantes.");
    }
  };

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await generateAdResponse(message);
      
      if (!threadId) {
        setThreadId(response.threadId);
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: response.result, isLoading: false }
          : msg
      ));
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Detalhes do erro:", {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { 
              ...msg, 
              content: 'Não foi possível conectar à IA no momento. Tente novamente em instantes.', 
              isLoading: false 
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setThreadId(null);
    setMessages([]);
  };

  return (
    <ChatLayout
      title="Copywriter de Anúncios"
      description="Gere textos de vendas persuasivos e conteúdo de marketing que converte visitantes em clientes."
      icon={<Megaphone className="h-6 w-6 text-primary" />}
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      placeholder="Descreva o tipo de anúncio que você precisa..."
      initialPrompts={initialPrompts}
      showInlineActions={true}
      onRestart={handleRestart}
      showRestartButton={threadId !== null}
    />
  );
}
