import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import ChatLayout, { ChatMessage } from './ChatLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';
import { useBackend } from '@/lib/backend';

export default function HiddenAgent() {
  useCompleteScrollToTop();

  const backend = useBackend();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const initialPrompts = [
    "Iniciar"
  ];

  const generateAgentResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await backend.hub.generateResponse({ 
        prompt: userMessage,
        assistantId: "asst_YvHPJHx201yVIH2tGefmHOYU"
      });
      
      return response.result;
    } catch (error) {
      console.error("Erro ao chamar OpenAI API:", error);
      throw new Error("Não foi possível conectar à IA no momento. Tente novamente em instantes.");
    }
  };

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await generateAgentResponse(message);
      
      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: response, isLoading: false }
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

  return (
    <ChatLayout
      title="Spy Digistore24"
      description="Gere links mascarados e protegidos para suas campanhas de afiliado com IA especializada"
      icon={<Shield className="h-6 w-6 text-primary" />}
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      placeholder="Cole seu link ou descreva onde vai usar..."
      initialPrompts={initialPrompts}
      showInlineActions={true}
    />
  );
}