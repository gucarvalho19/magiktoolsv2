import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  title?: string;
  type: 'html' | 'css' | 'js' | 'mixed';
}

export default function CodePreview({ code, title = "Preview do Código", type }: CodePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const extractJsContent = (code: string) => {
    // Extract JS content between <script> tags
    const jsMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (jsMatch) return jsMatch[1];
    
    // Check if it's standalone JavaScript
    if (code.includes('function') || code.includes('var ') || code.includes('let ') || 
        code.includes('const ') || code.includes('document.') || code.includes('window.')) {
      return code;
    }
    return null;
  };

  const createPreviewContent = () => {
    if (type === 'js') {
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

    let htmlContent = extractHtmlContent(code) || '';
    let cssContent = extractCssContent(code) || '';
    let jsContent = extractJsContent(code) || '';

    // Special handling for marquee generator
    if (code.includes('modern-marquee') || code.includes('marquee')) {
      // Extract the marquee HTML and CSS
      const marqueeHtmlMatch = code.match(/<div class="modern-marquee-container">[\s\S]*?<\/div>/i);
      const marqueeCssMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      
      if (marqueeHtmlMatch && marqueeCssMatch) {
        htmlContent = marqueeHtmlMatch[0];
        cssContent = marqueeCssMatch[1];
        jsContent = ''; // Skip JS for safety
      }
    }

    // Special handling for popup code
    if (code.includes('exit-popup') || code.includes('popup')) {
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
      jsContent = '';
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
            padding: 20px; 
            background: #f8f9fa;
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
  }, [showPreview, code, type]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Ocultar Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Mostrar Preview
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {showPreview && (
        <CardContent>
          {previewError ? (
            <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200">{previewError}</span>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-b">
                Preview - Visualização do código gerado
              </div>
              <iframe
                ref={iframeRef}
                className="w-full h-64 border-0"
                sandbox="allow-same-origin"
                title="Code Preview"
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}