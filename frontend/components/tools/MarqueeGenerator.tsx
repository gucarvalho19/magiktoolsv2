import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Type, Copy, Download, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TwoColumnToolLayout from './TwoColumnToolLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';
import CopyFeedback from './CopyFeedback';

export default function MarqueeGenerator() {
  // Apply scroll-to-top on component mount
  useCompleteScrollToTop();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [formData, setFormData] = useState({
    text: '😎 DAILY UPDATES ON WELLNESS AND HEALTH',
    fontSize: 16,
    speed: 8,
    letterSpacing: 2,
    repetitions: 3,
    direction: 'left',
    behavior: 'scroll',
    backgroundColor: '#ff0000',
    textColor: '#ffffff',
    fontFamily: 'Arial'
  });
  
  const [copiedColor, setCopiedColor] = useState<'bg' | 'text' | null>(null);
  
  const { toast } = useToast();

  // Ensure page starts at top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const generateMarqueeCode = async () => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const text = formData.text || 'Seu texto rolante aqui!';
    const items = Array(formData.repetitions).fill(text);
    const fontSize = formData.fontSize;
    const speed = formData.speed;
    const letterSpacing = formData.letterSpacing;
    const direction = formData.direction || 'left';
    const behavior = formData.behavior || 'scroll';
    const bgColor = formData.backgroundColor || '#ff0000';
    const textColor = formData.textColor || '#ffffff';
    const height = Math.max(fontSize + 16, 32);
    const gap = 32;

    const itemsHtml = [...items, ...items].map(item => 
      `    <span class="banner__item">${item}</span>`
    ).join('\n');

    const mockMarqueeCode = `<style>
  :root {
    --bg: ${bgColor};
    --fg: ${textColor};
    --height: ${height}px;
    --font-size: ${fontSize}px;
    --speed: ${speed}s;
    --gap: ${gap}px;
    --letter-spacing: ${letterSpacing}px;
  }

  .banner {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: var(--height);
    background: var(--bg);
    border: 1px solid rgba(0,0,0,.1);
  }

  .banner__track {
    display: flex;
    gap: var(--gap);
    align-items: center;
    white-space: nowrap;
    will-change: transform;
    animation: scroll linear infinite;
    animation-duration: var(--speed);
    ${behavior === 'alternate' ? 'animation-direction: alternate;' : ''}
  }

  .banner__item {
    font: 700 var(--font-size)/1 ${formData.fontFamily}, Helvetica, Arial, sans-serif;
    color: var(--fg);
    letter-spacing: var(--letter-spacing);
    text-transform: uppercase;
  }

  @keyframes scroll {
    ${direction === 'left' ? 'from { transform: translateX(0); }\n    to { transform: translateX(-50%); }' : 'from { transform: translateX(-50%); }\n    to { transform: translateX(0); }'}
  }

  @media (prefers-reduced-motion: reduce) {
    .banner__track {
      animation: none;
    }
  }

  .banner:hover .banner__track {
    animation-play-state: paused;
  }
</style>

<div class="banner" role="region" aria-label="Letreiro">
  <div class="banner__track">
${itemsHtml}
  </div>
</div>`;

    setResult(mockMarqueeCode);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMarqueeCode();
  };

  const [isCopying, setIsCopying] = useState(false);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);

  const copyToClipboard = async (text: string) => {
    if (isCopying) return;
    
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(text);
      setShowCopiedPopup(true);
      
      setTimeout(() => {
        setShowCopiedPopup(false);
        setTimeout(() => {
          setIsCopying(false);
        }, 200);
      }, 1500);
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível copiar o código.", variant: "destructive" });
      setIsCopying(false);
    }
  };

  const copyColorToClipboard = async (color: string, type: 'bg' | 'text') => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(type);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível copiar a cor.", variant: "destructive" });
    }
  };

  const exportToTxt = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marquee-code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Arquivo exportado!", description: "O código foi exportado como arquivo TXT." });
  };

  const saveToHistory = () => {
    const historyItem = {
      id: Date.now(),
      text: formData.text,
      settings: formData,
      code: result,
      timestamp: new Date().toISOString()
    };
    const existing = JSON.parse(localStorage.getItem('marquee-history') || '[]');
    existing.unshift(historyItem);
    localStorage.setItem('marquee-history', JSON.stringify(existing.slice(0, 10)));
    toast({ title: "Salvo no histórico!", description: "Configuração salva no histórico local." });
  };

  // Generate preview in real-time
  useEffect(() => {
    // Preview updates automatically, but code generation is manual
  }, [formData]);

  // Compact preview component with real animation
  const MarqueePreview = () => {
    if (!formData.text) return null;
    
    const repeatedText = Array(formData.repetitions).fill(formData.text).join(' - ');
    const animationName = `marquee-${formData.direction}`;
    const animationDuration = `${formData.speed}s`;
    
    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Preview</h3>
        <div 
          className="w-full overflow-hidden relative flex items-center"
          style={{
            backgroundColor: formData.backgroundColor,
            minHeight: `${Math.max(formData.fontSize + 16, 32)}px`,
            padding: '8px 0'
          }}
        >
          <style>
            {`
              @keyframes marquee-left {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
              }
              @keyframes marquee-right {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .animated-marquee {
                display: flex;
                width: max-content;
                animation: ${animationName} ${animationDuration} linear infinite;
                ${formData.behavior === 'alternate' ? 'animation-direction: alternate;' : ''}
              }
            `}
          </style>
          <div 
            className="animated-marquee whitespace-nowrap"
            style={{
              color: formData.textColor,
              fontSize: `${formData.fontSize}px`,
              fontWeight: '600',
              letterSpacing: `${formData.letterSpacing}px`,
              textTransform: 'uppercase',
              lineHeight: '1',
              fontFamily: `${formData.fontFamily}, sans-serif`
            }}
          >
            {repeatedText}
          </div>
        </div>
      </div>
    );
  };

  // Left Column - Configuration Form
  const leftColumn = (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Letreiro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="text">Texto do Letreiro</Label>
            <Textarea
              id="text"
              placeholder="😎 Digite seu texto rolante aqui... (emojis são permitidos!)"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              rows={2}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tamanho da Fonte: {formData.fontSize}px</Label>
            <Slider
              value={[formData.fontSize]}
              onValueChange={([value]) => setFormData({ ...formData, fontSize: value })}
              min={8}
              max={48}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Velocidade: {formData.speed}s</Label>
            <Slider
              value={[formData.speed]}
              onValueChange={([value]) => setFormData({ ...formData, speed: value })}
              min={5}
              max={60}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Espaçamento entre Letras: {formData.letterSpacing}px</Label>
            <Slider
              value={[formData.letterSpacing]}
              onValueChange={([value]) => setFormData({ ...formData, letterSpacing: value })}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Repetições do Texto: {formData.repetitions}</Label>
            <Slider
              value={[formData.repetitions]}
              onValueChange={([value]) => setFormData({ ...formData, repetitions: value })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Fonte</Label>
            <Select value={formData.fontFamily} onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="direction">Direção</Label>
              <Select value={formData.direction} onValueChange={(value) => setFormData({ ...formData, direction: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda → Direita</SelectItem>
                  <SelectItem value="right">Direita → Esquerda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="behavior">Comportamento</Label>
              <Select value={formData.behavior} onValueChange={(value) => setFormData({ ...formData, behavior: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scroll">Rolagem Contínua</SelectItem>
                  <SelectItem value="alternate">Vai e Volta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Cor de Fundo</Label>
              <div className="flex space-x-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-16"
                />
                <Input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  placeholder="#ff0000"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyColorToClipboard(formData.backgroundColor, 'bg')}
                  className="px-3"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {copiedColor === 'bg' && (
                  <span className="text-sm text-green-600 self-center whitespace-nowrap">
                    Copiado!
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="textColor">Cor da Fonte</Label>
              <div className="flex space-x-2">
                <Input
                  id="textColor"
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="w-16"
                />
                <Input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyColorToClipboard(formData.textColor, 'text')}
                  className="px-3"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {copiedColor === 'text' && (
                  <span className="text-sm text-green-600 self-center whitespace-nowrap">
                    Copiado!
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ajuste as opções e clique em 'Gerar Código' para atualizar o código.
            </p>
            <Button onClick={generateMarqueeCode} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerar Código do Letreiro
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Right Column - Results with preview and code
  const rightColumn = (
    <div className="space-y-4">
      <MarqueePreview />
      {result ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Código do Letreiro Gerado</CardTitle>
            <div className="flex gap-2 relative">
              <CopyFeedback show={showCopiedPopup} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result)}
                disabled={isCopying}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToTxt}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveToHistory}
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar no Histórico
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-center">
              Clique em "Gerar Código do Letreiro" para ver o código aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <TwoColumnToolLayout
      title="Gerador de Letreiro Animado"
      description="Crie letreiros com scroll horizontal infinito para WordPress, Elementor e outros"
      icon={<Type className="h-6 w-6 text-primary" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}