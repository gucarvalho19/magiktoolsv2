import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Upload, Clipboard, Image as ImageIcon, X, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import ToolResultCard from './ToolResultCard';
import TwoColumnToolLayout from './TwoColumnToolLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';
import CopyFeedback from './CopyFeedback';

interface AuthorConfig {
  authorName: string;
  title: string;
  authorImage: string;
  imageSize: number;
  readingTime: string;
  textColor: string;
  timestampColor: string;
  fontFamily: string;
  fontSize: number;
  alignment: 'left' | 'center' | 'right';
  hours: number;
  minutes: number;
  timeFormat: '12h' | '24h';
}

export default function AuthorGenerator() {
  // Apply scroll-to-top on component mount
  useCompleteScrollToTop();

  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedColor, setCopiedColor] = useState<'text' | 'timestamp' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { theme } = useTheme();
  
  const [config, setConfig] = useState<AuthorConfig>({
    authorName: 'João Silva',
    title: 'Especialista em Marketing',
    authorImage: '',
    imageSize: 40,
    readingTime: '2 minute read',
    textColor: '#333333',
    timestampColor: '#666666',
    fontFamily: 'Arial',
    fontSize: 14,
    alignment: 'left',
    hours: 14,
    minutes: 30,
    timeFormat: '24h'
  });

  // Generate current date formatted (always in English)
  const currentDate = useMemo(() => {
    const now = new Date();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const days = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    
    const dayName = days[now.getDay()];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    
    return `${dayName}, ${month} ${day}, ${year}`;
  }, []);

  // Format time based on selected format
  const formattedTime = useMemo(() => {
    if (config.timeFormat === '24h') {
      return `${config.hours.toString().padStart(2, '0')}:${config.minutes.toString().padStart(2, '0')}`;
    } else {
      const hour12 = config.hours === 0 ? 12 : config.hours > 12 ? config.hours - 12 : config.hours;
      const ampm = config.hours >= 12 ? 'PM' : 'AM';
      return `${hour12}:${config.minutes.toString().padStart(2, '0')} ${ampm}`;
    }
  }, [config.hours, config.minutes, config.timeFormat]);

  const updateConfig = (key: keyof AuthorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Validate image file type
  const isValidImageType = (file: File) => {
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  };

  // Process image file
  const processImageFile = async (file: File) => {
    if (!isValidImageType(file)) {
      setImageError('Tipo de arquivo inválido. Use apenas PNG, JPG, JPEG, GIF ou WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setImageError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setImageLoading(true);
    setImageError('');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateConfig('authorImage', e.target?.result as string);
        setImageLoading(false);
      };
      reader.onerror = () => {
        setImageError('Erro ao processar o arquivo.');
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setImageError('Erro ao processar o arquivo.');
      setImageLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (imageLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePasteImage = async () => {
    if (imageLoading) return;
    
    try {
      // Try to read clipboard as text first (for URLs)
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http') || text.startsWith('data:image'))) {
        updateConfig('authorImage', text);
        setImageError('');
        return;
      }
    } catch (err) {
      // Ignore text clipboard errors, try image clipboard
    }

    try {
      // Try to read clipboard as image
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], 'pasted-image.png', { type });
            processImageFile(file);
            return;
          }
        }
      }
      setImageError('Nenhuma imagem encontrada na área de transferência.');
    } catch (err) {
      setImageError('Erro ao acessar a área de transferência.');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (imageLoading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processImageFile(imageFile);
    } else {
      setImageError('Arraste apenas arquivos de imagem.');
    }
  };

  const clearImage = () => {
    updateConfig('authorImage', '');
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateHours = (value: number) => {
    if (config.timeFormat === '24h') {
      return Math.max(0, Math.min(23, value));
    } else {
      return Math.max(1, Math.min(12, value));
    }
  };

  const validateMinutes = (value: number) => {
    return Math.max(0, Math.min(59, value));
  };

  const copyColorToClipboard = async (color: string, type: 'text' | 'timestamp') => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(type);
      setTimeout(() => setCopiedColor(null), 2000);
      toast({ title: "Cor copiada!", description: "A cor foi copiada para a área de transferência." });
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível copiar a cor.", variant: "destructive" });
    }
  };

  const generateCode = async () => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const avatarSrc = config.authorImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
    
    const fullCode = `<style>
.author-card {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: ${config.fontFamily}, sans-serif;
  font-size: ${config.fontSize}px;
  text-align: ${config.alignment};
  ${config.alignment === 'center' ? 'justify-content: center;' : ''}
  ${config.alignment === 'right' ? 'justify-content: flex-end;' : ''}
}

.author-card img {
  width: ${config.imageSize}px;
  height: ${config.imageSize}px;
  border-radius: 50%;
  object-fit: cover;
}

.author-card .author-name {
  color: ${config.textColor};
  font-weight: 600;
  margin-bottom: 2px;
}

.author-card .author-meta {
  color: ${config.timestampColor};
  font-size: ${config.fontSize - 2}px;
}
</style>

<div class="author-card">
  <img 
    src="${avatarSrc}" 
    alt="${config.authorName}"
  />
  <div>
    <div class="author-name">
      By ${config.authorName}${config.title ? `, ${config.title}` : ''}
    </div>
    <div class="author-meta">
      ⏱ ${config.readingTime} · Updated ${formattedTime}, ${currentDate}
    </div>
  </div>
</div>`;

    setGeneratedCode(fullCode);
    setIsLoading(false);
  };

  // Preview Component
  const PreviewCard = () => {
    const avatarSrc = config.authorImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center gap-3 p-4 rounded-lg"
            style={{
              fontFamily: config.fontFamily,
              fontSize: `${config.fontSize}px`,
              textAlign: config.alignment,
              justifyContent: config.alignment === 'center' ? 'center' : config.alignment === 'right' ? 'flex-end' : 'flex-start',
              backgroundColor: theme === 'dark' ? '#ffffff' : '#f9fafb'
            }}
          >
            <img 
              src={avatarSrc}
              alt={config.authorName}
              className="rounded-full object-cover"
              style={{
                width: `${config.imageSize}px`,
                height: `${config.imageSize}px`
              }}
            />
            <div>
              <div 
                style={{ 
                  color: config.textColor, 
                  fontWeight: 600, 
                  marginBottom: '2px' 
                }}
              >
                By {config.authorName}{config.title ? `, ${config.title}` : ''}
              </div>
              <div 
                style={{ 
                  color: config.timestampColor, 
                  fontSize: `${config.fontSize - 2}px` 
                }}
              >
                ⏱ {config.readingTime} · Updated {formattedTime}, {currentDate}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Left Column - Configuration Form
  const leftColumn = (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Autor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nome do Autor */}
        <div className="space-y-2">
          <Label htmlFor="authorName">Nome do Autor</Label>
          <Input
            id="authorName"
            value={config.authorName}
            onChange={(e) => updateConfig('authorName', e.target.value)}
            placeholder="Ex: João Silva"
          />
        </div>

        {/* Título/Sufixo */}
        <div className="space-y-2">
          <Label htmlFor="title">Título/Sufixo</Label>
          <Input
            id="title"
            value={config.title}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="Ex: Especialista em Marketing"
          />
        </div>

        {/* Imagem do Autor */}
        <div className="space-y-2">
          <Label>Imagem do Autor</Label>
          <div className="space-y-3">
            {/* Drag & Drop Area */}
            <div
              ref={dropAreaRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-3 transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <Input
                value={config.authorImage}
                onChange={(e) => {
                  updateConfig('authorImage', e.target.value);
                  setImageError('');
                }}
                placeholder="URL da imagem ou arraste uma imagem aqui"
                disabled={imageLoading}
                className={isDragOver ? 'border-primary' : ''}
              />
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImageUpload}
                disabled={imageLoading}
                className="flex-1"
              >
                {imageLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasteImage}
                disabled={imageLoading}
                className="flex-1"
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Colar
              </Button>
              {config.authorImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearImage}
                  disabled={imageLoading}
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Image Preview */}
            {config.authorImage && !imageError && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <img
                  src={config.authorImage}
                  alt="Preview"
                  className="w-12 h-12 rounded-full object-cover border"
                  onError={() => setImageError('Erro ao carregar a imagem.')}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Imagem carregada
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {config.authorImage.startsWith('data:') 
                      ? 'Arquivo local carregado' 
                      : config.authorImage}
                  </p>
                </div>
                <ImageIcon className="h-5 w-5 text-green-500" />
              </div>
            )}

            {/* Error Message */}
            {imageError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {imageError}
                </p>
              </div>
            )}

            {/* Loading State */}
            {imageLoading && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Processando imagem...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tamanho da Imagem */}
        <div className="space-y-2">
          <Label htmlFor="imageSize">Tamanho da Imagem (px)</Label>
          <Input
            id="imageSize"
            type="number"
            min="20"
            max="100"
            value={config.imageSize}
            onChange={(e) => updateConfig('imageSize', parseInt(e.target.value) || 40)}
          />
        </div>

        {/* Tempo de Leitura */}
        <div className="space-y-2">
          <Label htmlFor="readingTime">Tempo de Leitura</Label>
          <Input
            id="readingTime"
            value={config.readingTime}
            onChange={(e) => updateConfig('readingTime', e.target.value)}
            placeholder="Ex: 2 minute read"
          />
        </div>

        {/* Configuração de Horário */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Configuração de Horário</Label>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="hours" className="text-sm">Horas</Label>
              <Input
                id="hours"
                type="number"
                min={config.timeFormat === '24h' ? '0' : '1'}
                max={config.timeFormat === '24h' ? '23' : '12'}
                value={config.hours}
                onChange={(e) => updateConfig('hours', validateHours(parseInt(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="minutes" className="text-sm">Minutos</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={config.minutes}
                onChange={(e) => updateConfig('minutes', validateMinutes(parseInt(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="timeFormat" className="text-sm">Formato</Label>
              <Select value={config.timeFormat} onValueChange={(value: '12h' | '24h') => {
                updateConfig('timeFormat', value);
                // Adjust hours if switching to 12h format
                if (value === '12h' && config.hours === 0) {
                  updateConfig('hours', 12);
                } else if (value === '12h' && config.hours > 12) {
                  updateConfig('hours', config.hours - 12);
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12h</SelectItem>
                  <SelectItem value="24h">24h</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cor do Texto Principal */}
        <div className="space-y-2">
          <Label htmlFor="textColor">Cor do Texto Principal</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              type="color"
              value={config.textColor}
              onChange={(e) => updateConfig('textColor', e.target.value)}
              className="w-12 h-10 p-1 border rounded"
            />
            <div className="flex flex-1 gap-1">
              <Input
                value={config.textColor}
                onChange={(e) => updateConfig('textColor', e.target.value)}
                placeholder="#333333"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyColorToClipboard(config.textColor, 'text')}
                className="px-2 h-10"
              >
                <Copy className="h-3 w-3" />
              </Button>
              {copiedColor === 'text' && (
                <span className="text-sm text-green-600 self-center whitespace-nowrap">
                  Copiado!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cor do Timestamp */}
        <div className="space-y-2">
          <Label htmlFor="timestampColor">Cor do Timestamp</Label>
          <div className="flex gap-2">
            <Input
              id="timestampColor"
              type="color"
              value={config.timestampColor}
              onChange={(e) => updateConfig('timestampColor', e.target.value)}
              className="w-12 h-10 p-1 border rounded"
            />
            <div className="flex flex-1 gap-1">
              <Input
                value={config.timestampColor}
                onChange={(e) => updateConfig('timestampColor', e.target.value)}
                placeholder="#666666"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyColorToClipboard(config.timestampColor, 'timestamp')}
                className="px-2 h-10"
              >
                <Copy className="h-3 w-3" />
              </Button>
              {copiedColor === 'timestamp' && (
                <span className="text-sm text-green-600 self-center whitespace-nowrap">
                  Copiado!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fonte */}
        <div className="space-y-2">
          <Label htmlFor="fontFamily">Fonte</Label>
          <Select value={config.fontFamily} onValueChange={(value) => updateConfig('fontFamily', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
              <SelectItem value="Tahoma">Tahoma</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tamanho da Fonte */}
        <div className="space-y-2">
          <Label htmlFor="fontSize">Tamanho da Fonte (px)</Label>
          <Input
            id="fontSize"
            type="number"
            min="10"
            max="24"
            value={config.fontSize}
            onChange={(e) => updateConfig('fontSize', parseInt(e.target.value) || 14)}
          />
        </div>

        {/* Alinhamento */}
        <div className="space-y-2">
          <Label htmlFor="alignment">Alinhamento</Label>
          <Select value={config.alignment} onValueChange={(value: 'left' | 'center' | 'right') => updateConfig('alignment', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botão Gerar Código */}
        <Button onClick={generateCode} className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Gerar Código
        </Button>
      </CardContent>
    </Card>
  );

  const [isCopying, setIsCopying] = useState(false);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);

  const handleCopyCode = async () => {
    if (!generatedCode || isCopying) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(generatedCode);
      setShowCopiedPopup(true);
      
      setTimeout(() => {
        setShowCopiedPopup(false);
        setTimeout(() => {
          setIsCopying(false);
        }, 200);
      }, 1500);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao copiar para a área de transferência.',
        variant: 'destructive',
      });
      setIsCopying(false);
    }
  };

  // Right Column - Preview + Code
  const rightColumn = (
    <div className="space-y-4">
      <PreviewCard />
      
      {generatedCode ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Código Gerado</CardTitle>
              <div className="relative">
                <CopyFeedback show={showCopiedPopup} />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyCode}
                  disabled={isCopying}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                {generatedCode}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Código</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-muted-foreground text-center">
                Clique em "Gerar Código" para ver o HTML e CSS aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <TwoColumnToolLayout
      title="Gerador de Autor com Horário"
      description="Crie cartões de autor personalizados com avatar, nome, título e timestamp. Preview em tempo real e código HTML/CSS pronto para usar."
      icon={<User className="h-6 w-6 text-primary" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}