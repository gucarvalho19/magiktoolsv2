import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Cookie, AlertCircle } from 'lucide-react';
import ToolResultCard from './ToolResultCard';
import TwoColumnToolLayout from './TwoColumnToolLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';

export default function CookieMarker() {
  useCompleteScrollToTop();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [affiliateLink, setAffiliateLink] = useState('');

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError('');
      return false;
    }
    
    const urlPattern = /^(https?:\/\/).+/i;
    if (!urlPattern.test(url)) {
      setUrlError('Insira uma URL válida, ex.: https://seusite.com');
      return false;
    }
    
    setUrlError('');
    return true;
  };

  const generateCookieCode = async () => {
    if (!validateUrl(affiliateLink)) {
      return;
    }
    
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cookieCode = `<script>
  // Seu hoplink aqui
  var affiliateLink = "${affiliateLink}";

  // Função para disparar o cookie
  function dropCookie() {
    var img = new Image();
    img.src = affiliateLink + "&rand=" + Math.random();
    // "rand" adiciona ruído → evita cache e parece acesso real
  }

  // Delay aleatório (2 a 6 segundos)
  var delay = Math.floor(Math.random() * (6000 - 2000 + 1)) + 2000;

  // Dispara quando o usuário interagir OU após delay
  setTimeout(dropCookie, delay);
  document.addEventListener("click", dropCookie, { once: true });
  document.addEventListener("scroll", dropCookie, { once: true });
</script>`;

    setResult(cookieCode);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateCookieCode();
  };

  const leftColumn = (
    <Card>
      <CardHeader>
        <CardTitle>Configuração</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="affiliateLink">Link de Afiliado (Hoplink)</Label>
            <div className="relative">
              <Input
                id="affiliateLink"
                type="text"
                placeholder="https://SEUHOPLINK.com"
                value={affiliateLink}
                onChange={(e) => {
                  setAffiliateLink(e.target.value);
                  validateUrl(e.target.value);
                }}
                onBlur={(e) => validateUrl(e.target.value)}
                required
                className={urlError ? 'border-orange-500 focus-visible:ring-orange-500' : ''}
              />
              {urlError && (
                <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-600 dark:text-orange-400">{urlError}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Inclua o protocolo (https://). Ex.: https://SEUHOPLINK.com?tid=&#123;&#123;seu_tid&#125;&#125;
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Código
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const rightColumn = result ? (
    <ToolResultCard
      title="Código Gerado"
      result={result}
      showPreview={false}
    />
  ) : (
    <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <p className="text-muted-foreground text-center">
        Configure o link à esquerda e clique em "Gerar Código" para ver o resultado aqui.
      </p>
    </div>
  );

  return (
    <TwoColumnToolLayout
      title="Marcador de Cookie na Presell"
      description="Gere código JavaScript personalizado para disparar automaticamente seu cookie de afiliado em páginas de presell."
      disclaimer={
        <div className="mt-1.5 flex items-start gap-2 px-1 py-1 text-[13px] font-medium" style={{ color: '#b56500' }}>
          <span>⚠️</span>
          <span>
            <strong>Aviso importante:</strong> O uso desta ferramenta pode violar políticas de plataformas de anúncios ou hospedagem e resultar em <strong>suspensão de conta, bloqueio de domínio ou restrições de acesso</strong>. Utilize com responsabilidade e por sua conta e risco.
          </span>
        </div>
      }
      icon={<Cookie className="h-6 w-6 text-primary" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}
