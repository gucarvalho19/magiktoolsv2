import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CopyFeedback from './CopyFeedback';

interface ToolResultCardProps {
  title: string;
  result: string;
  showCopy?: boolean;
  showExport?: boolean;
  showSave?: boolean;
  showPreview?: boolean;
  previewType?: 'html' | 'css' | 'js' | 'mixed';
  previewHeight?: string; // Nova prop para altura customizada
}

export default function ToolResultCard({ 
  title, 
  result, 
  showCopy = true, 
  showExport = true, 
  showSave = true,
  showPreview = false,
  previewType = 'mixed',
  previewHeight = 'h-64' // Altura padrão
}: ToolResultCardProps) {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);

  const handleCopy = async () => {
    if (isCopying) return;
    
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(result);
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

  const handleExport = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exportado!',
      description: 'Resultado exportado como arquivo TXT.',
    });
  };

  const handleSave = () => {
    // Mocked save functionality
    toast({
      title: 'Salvo!',
      description: 'Resultado salvo no histórico (simulado).',
    });
  };

  const extractHtmlContent = (code: string) => {
    // Extract HTML content between <!-- --> comments or <div> tags
    const htmlMatch = code.match(/<div[^>]*>[\s\S]*?<\/div>/i) || 
                     code.match(/<[^>]+>[\s\S]*?<\/[^>]+>/i);
    return htmlMatch ? htmlMatch[0] : null;
  };

  const extractCssContent = (code: string) => {
    // Extract CSS content between <style> tags or standalone CSS
    const cssMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (cssMatch) return cssMatch[1];
    
    // Check if it's standalone CSS (contains selectors and properties)
    if (code.includes('{') && code.includes('}') && (code.includes('.') || code.includes('#') || /[a-zA-Z][\w-]*\s*{/.test(code))) {
      return code;
    }
    return null;
  };

  const createPreviewContent = () => {
    if (previewType === 'js') {
      // For JavaScript-only code, show a safe message
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .preview-notice { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              border-radius: 8px; 
              padding: 15px; 
              color: #856404;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="preview-notice">
            <strong>⚠️ Preview indisponível para este tipo de código</strong><br>
            Este código contém JavaScript que não pode ser executado com segurança no preview.
          </div>
        </body>
        </html>
      `;
    }

    let htmlContent = extractHtmlContent(result) || '';
    let cssContent = extractCssContent(result) || '';

    // Special handling for marquee generator
    if (result.includes('modern-marquee') || result.includes('marquee')) {
      // Extract the marquee HTML and CSS
      const marqueeHtmlMatch = result.match(/<div class="modern-marquee-container">[\s\S]*?<\/div>/i);
      const marqueeCssMatch = result.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      
      if (marqueeHtmlMatch && marqueeCssMatch) {
        htmlContent = marqueeHtmlMatch[0];
        cssContent = marqueeCssMatch[1];
      }
    }

    // Special handling for popup code
    if (result.includes('exit-popup') || result.includes('popup')) {
      // Create a safe demo popup
      htmlContent = `
        <div style="position: relative; height: 200px; background: #f0f0f0; border-radius: 8px; overflow: hidden;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; max-width: 300px;">
            <h3 style="color: #e74c3c; margin-bottom: 10px;">Espere! Não Saia Ainda!</h3>
            <p style="margin-bottom: 15px; color: #333;">Ganhe 50% de desconto antes de sair!</p>
            <button style="background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Resgatar Desconto</button>
          </div>
        </div>
      `;
      cssContent = '';
    }

    if (!htmlContent && !cssContent) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .preview-notice { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              border-radius: 8px; 
              padding: 15px; 
              color: #856404;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="preview-notice">
            <strong>Preview indisponível para este tipo de código</strong><br>
            O código gerado não contém elementos visuais que possam ser renderizados com segurança.
          </div>
        </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 10px; 
            background: transparent;
          }
          ${cssContent}
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
  };

  useEffect(() => {
    if (showPreview && iframeRef.current) {
      try {
        const previewContent = createPreviewContent();
        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(previewContent);
          iframeDoc.close();
          setPreviewError(null);
        }
      } catch (error) {
        setPreviewError('Erro ao renderizar preview');
        console.error('Preview error:', error);
      }
    }
  }, [result, showPreview, previewType]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          
          {/* Action Buttons */}
          <div className="flex gap-2 relative">
            <CopyFeedback show={showCopiedPopup} />
            {showCopy && (
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={isCopying}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            )}
            {showExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar TXT
              </Button>
            )}
            {showSave && (
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar no Histórico
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview Section */}
        {showPreview && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Preview do Código</h4>
            {previewError ? (
              <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <span className="text-red-800 dark:text-red-200 text-sm">{previewError}</span>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-b">
                  Visualização do código gerado
                </div>
                <iframe
                  ref={iframeRef}
                  className={`w-full ${previewHeight} border-0`}
                  sandbox="allow-same-origin"
                  title="Code Preview"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Code Result */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Código Gerado</h4>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
              {result}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}