import React, { useState } from 'react';
import { Target } from 'lucide-react';
import ChatLayout, { ChatMessage } from './ChatLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';
import { useBackend } from '@/lib/backend';

export default function NegativeKeywordsPlanner() {
  useCompleteScrollToTop();

  const backend = useBackend();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const initialPrompts = [
    "Iniciar"
  ];

  const generateKeywordsResponse = async (userMessage: string): Promise<{ result: string; threadId: string }> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    
    try {
      const response = await backend.hub.generateResponse({ 
        prompt: userMessage,
        assistantId: "asst_h3YQGljkhjd2svw1b3uHyoFZ",
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
      const response = await generateKeywordsResponse(message);
      
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
      title="Planejador de Palavras-chave Negativas"
      description="Gere listas inteligentes de palavras-chave negativas para otimizar suas campanhas e reduzir custos"
      icon={<Target className="h-6 w-6 text-primary" />}
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      placeholder="Descreva seu negócio ou campanha..."
      initialPrompts={initialPrompts}
      showInlineActions={true}
      onRestart={handleRestart}
      showRestartButton={threadId !== null}
    />
  );
}
