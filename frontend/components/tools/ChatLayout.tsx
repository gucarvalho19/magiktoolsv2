import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Copy, Download, MoreVertical, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  initialPrompts?: string[];
  showInlineActions?: boolean;
  onRestart?: () => void;
  showRestartButton?: boolean;
}

export default function ChatLayout({
  title,
  description,
  icon,
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Digite sua mensagem...",
  initialPrompts = [],
  showInlineActions = false,
  onRestart,
  showRestartButton = false
}: ChatLayoutProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        handleSubmit(e);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (!isLoading) {
      const messageToSend = prompt === "Iniciar" ? "iniciar" : prompt;
      onSendMessage(messageToSend);
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copiado!',
        description: 'Mensagem copiada para a área de transferência.',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao copiar para a área de transferência.',
        variant: 'destructive',
      });
    }
  };

  const handleExportMessage = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exportado!',
      description: 'Mensagem exportada como arquivo TXT.',
    });
  };



  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {icon}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {showRestartButton && onRestart && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRestart}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Recomeçar
          </Button>
        )}
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              {initialPrompts.length > 0 && (
                <div className="flex items-center justify-center">
                  {initialPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="p-4 h-auto"
                      onClick={() => handlePromptClick(prompt)}
                      disabled={isLoading}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted text-foreground mr-4'
                    }`}
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex-1">
                        {message.isLoading ? (
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                              <span className="text-sm">Processando sua solicitação...</span>
                            </div>
                            <span className="text-xs opacity-70">Isso pode levar alguns segundos devido ao volume do texto</span>
                          </div>
                        ) : (
                          <>
                            {message.type === 'assistant' ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert prose-a:text-blue-500 prose-a:underline hover:prose-a:text-blue-600 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300">
                                <ReactMarkdown
                                  components={{
                                    a: ({ node, ...props }) => (
                                      <a 
                                        {...props} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="font-medium transition-colors"
                                      />
                                    ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <pre className="whitespace-pre-wrap text-sm font-sans">{message.content}</pre>
                            )}
                            {showInlineActions && message.type === 'assistant' && (
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyMessage(message.content)}
                                  className="h-8 px-3 text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                                  Copiar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExportMessage(message.content)}
                                  className="h-8 px-3 text-muted-foreground hover:text-foreground"
                                >
                                  <Download className="h-3.5 w-3.5 mr-1.5" />
                                  Exportar TXT
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {message.type === 'assistant' && !message.isLoading && !showInlineActions && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyMessage(message.content)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportMessage(message.content)}>
                              <Download className="h-4 w-4 mr-2" />
                              Exportar TXT
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    <div className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1 min-h-[40px] max-h-[200px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
            />
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Enter para enviar • Shift+Enter para quebra de linha</span>
            <span>{inputValue.length}/1000</span>
          </div>
        </div>
      </Card>
    </div>
  );
}