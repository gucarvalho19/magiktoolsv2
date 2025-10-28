import React, { useState } from 'react';
import { PenTool } from 'lucide-react';
import ChatLayout, { ChatMessage } from './ChatLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';
import { useBackend } from '@/lib/useBackend';

export default function CopyBuilder() {
  useCompleteScrollToTop();

  const backend = useBackend();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const initialPrompts = [
    "Iniciar"
  ];

  const generateCopyResponse = async (userMessage: string, attempt: number = 0): Promise<{ result: string; threadId: string }> => {
    const MAX_ATTEMPTS = 3;
    const TIMEOUT_MS = 180000;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
      const response = await backend.hub.generateResponse({ 
        prompt: userMessage,
        assistantId: "asst_Y5yrniywKUKx1glzclmrBz7s",
        threadId: threadId || undefined
      });
      
      clearTimeout(timeout);
      
      if (!response || !response.result) {
        throw new Error("Resposta vazia da API");
      }
      
      return { result: response.result, threadId: response.threadId };
    } catch (error) {
      clearTimeout(timeout);
      console.error(`Erro ao chamar OpenAI API (tentativa ${attempt + 1}/${MAX_ATTEMPTS}):`, error);
      
      const isNetworkError = error instanceof Error && (
        error.name === 'AbortError' ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout')
      );
      
      if (isNetworkError && attempt < MAX_ATTEMPTS - 1) {
        const backoffDelay = Math.pow(2, attempt) * 3000;
        console.log(`Tentando novamente em ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return generateCopyResponse(userMessage, attempt + 1);
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("A IA está processando sua solicitação. Isso pode levar alguns segundos a mais devido ao volume do texto. Por favor, aguarde...");
      }
      
      throw new Error("Não foi possível conectar à IA no momento. Por favor, tente novamente.");
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
      const response = await generateCopyResponse(message);
      
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
              content: errorMessage, 
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
      title="Copywriter de Review"
      description="Crie anúncios atraentes para Google Ads, com geração baseada em IA."
      icon={<PenTool className="h-6 w-6 text-primary" />}
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      placeholder="Descreva o tipo de copy que você precisa..."
      initialPrompts={initialPrompts}
      showInlineActions={true}
      onRestart={handleRestart}
      showRestartButton={threadId !== null}
    />
  );
}
