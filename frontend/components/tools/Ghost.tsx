import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Eye, Copy, Check } from 'lucide-react';
import TwoColumnToolLayout from './TwoColumnToolLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';
import { useToast } from '@/components/ui/use-toast';

export default function Ghost() {
  // Apply scroll-to-top on component mount
  useCompleteScrollToTop();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    targetWord: '',
    originalText: ''
  });

  const generateMaskedText = async () => {
    setError('');
    setResult('');
    
    if (!formData.targetWord.trim()) {
      setError('Informe um texto para mascarar.');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const targetWord = formData.targetWord.trim();
    
    const cyrillicMap: { [key: string]: string } = {
      'A': 'А', 'B': 'В', 'C': 'С', 'E': 'Е', 'H': 'Н', 'I': 'І',
      'J': 'Ј', 'K': 'К', 'M': 'М', 'N': 'Ν', 'O': 'О', 'P': 'Р',
      'S': 'Ѕ', 'T': 'Т', 'X': 'Х', 'Y': 'У', 'Z': 'Ζ',
      'a': 'а', 'c': 'с', 'e': 'е', 'i': 'і', 'j': 'ј',
      'o': 'о', 'p': 'р', 's': 'ѕ', 'x': 'х', 'y': 'у'
    };

    function maskWithHomoglyphs(text: string): string {
      return text.split('').map(char => cyrillicMap[char] || char).join('');
    }

    const cyrillicVersion = maskWithHomoglyphs(targetWord);

    setResult(cyrillicVersion);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMaskedText();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast({
        description: "Copiado!",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast({
        variant: "destructive",
        description: "Erro ao copiar texto",
      });
    }
  };

  // Left Column - Configuration Form
  const leftColumn = (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Mascaramento de Texto</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetWord">Palavra/Frase Alvo</Label>
            <Input
              id="targetWord"
              placeholder="Digite a palavra que deseja mascarar"
              value={formData.targetWord}
              onChange={(e) => {
                setFormData({ ...formData, targetWord: e.target.value });
                if (error) setError('');
              }}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500" role="alert" aria-live="polite">
                {error}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="originalText">Contexto (Opcional)</Label>
            <Textarea
              id="originalText"
              placeholder="Digite o contexto completo onde esta palavra será usada"
              value={formData.originalText}
              onChange={(e) => setFormData({ ...formData, originalText: e.target.value })}
              rows={3}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Texto Mascarado
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // Right Column - Results
  const rightColumn = result ? (
    <Card>
      <CardHeader>
        <CardTitle>Resultado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            value={result}
            readOnly
            className="min-h-[200px] resize-none pr-16 font-mono text-lg leading-relaxed"
            style={{ resize: 'vertical' }}
            onClick={(e) => {
              const textarea = e.target as HTMLTextAreaElement;
              textarea.select();
            }}
          />
          <Button
            onClick={copyToClipboard}
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 h-8"
            aria-label="Copiar texto mascarado"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">
              {copied ? 'Copiado!' : 'Copiar'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : (
    <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <p className="text-muted-foreground text-center">
        Configure as opções à esquerda e clique em "Gerar Texto Mascarado" para ver os resultados aqui.
      </p>
    </div>
  );

  return (
    <TwoColumnToolLayout
      title="Ghost"
      description="Gere texto mascarado usando caracteres cirílicos, árabes e gregos que se parecem visualmente com letras latinas. Use responsavelmente para fins de teste."
      icon={<Eye className="h-6 w-6 text-primary" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}