import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import ToolResultCard from './ToolResultCard';
import TwoColumnToolLayout from './TwoColumnToolLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';

export default function BackRedirect() {
  // Apply scroll-to-top on component mount
  useCompleteScrollToTop();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [formData, setFormData] = useState({
    redirectUrl: '',
    redirectType: '',
    delay: '0',
    executeOnlyOnce: false,
    mobileDevicesOnly: false
  });

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError('');
      return false;
    }
    
    const urlPattern = /^(https?:\/\/).+/i;
    if (!urlPattern.test(url)) {
      setUrlError('Insira uma URL válida, incluindo o protocolo — por exemplo: https://seusite.com');
      return false;
    }
    
    setUrlError('');
    return true;
  };

  const generateRedirectCode = async () => {
    if (!validateUrl(formData.redirectUrl)) {
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const redirectUrl = formData.redirectUrl || 'https://sua-pagina-de-oferta.com';
    const delay = parseInt(formData.delay) || 0;
    const redirectType = formData.redirectType || 'instant';
    const executeOnlyOnce = formData.executeOnlyOnce;
    const mobileDevicesOnly = formData.mobileDevicesOnly;

    const mockRedirectCode = `
<!-- Back Button Redirect - Blackhat Edition -->
<!-- Add this script before closing </body> tag -->

<script>
(function() {
  'use strict';
  
  let redirected = false;
  const targetUrl = '${redirectUrl}';
  const redirectDelay = ${delay * 1000}; // Convert to milliseconds
  const executeOnlyOnce = ${executeOnlyOnce};
  const mobileDevicesOnly = ${mobileDevicesOnly};
  
  // Check if redirect should be executed only once
  function shouldExecuteRedirect() {
    if (executeOnlyOnce) {
      const hasExecuted = localStorage.getItem('backRedirectExecuted') || sessionStorage.getItem('backRedirectExecuted');
      if (hasExecuted) {
        return false;
      }
    }
    
    // Check if redirect should be executed only on mobile devices
    if (mobileDevicesOnly) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      window.innerWidth <= 768;
      if (!isMobile) {
        return false;
      }
    }
    
    return true;
  }
  
  // Mark redirect as executed
  function markRedirectExecuted() {
    if (executeOnlyOnce) {
      localStorage.setItem('backRedirectExecuted', 'true');
      sessionStorage.setItem('backRedirectExecuted', 'true');
    }
  }
  
  // Method 1: History manipulation
  function manipulateHistory() {
    // Push fake history entries
    for(let i = 0; i < 10; i++) {
      history.pushState({}, '', location.href);
    }
  }
  
  // Method 2: Popstate event hijacking
  function setupPopstateHijack() {
    window.addEventListener('popstate', function(e) {
      if (!redirected && shouldExecuteRedirect()) {
        redirected = true;
        markRedirectExecuted();
        
        // Track the back button attempt
        if (typeof gtag !== 'undefined') {
          gtag('event', 'back_button_blocked', {
            'event_category': 'blackhat',
            'event_label': 'redirect'
          });
        }
        
        ${redirectType === 'instant' ? `
        // Instant redirect
        location.replace(targetUrl);
        ` : redirectType === 'delayed' ? `
        // Delayed redirect with message
        if (redirectDelay > 0) {
          alert('Please wait, redirecting to exclusive offer...');
          setTimeout(function() {
            location.replace(targetUrl);
          }, redirectDelay);
        } else {
          location.replace(targetUrl);
        }
        ` : `
        // Force multiple redirects
        for(let i = 0; i < 5; i++) {
          setTimeout(function() {
            location.replace(targetUrl);
          }, i * 100);
        }
        `}
      }
    });
  }
  
  // Method 3: Beforeunload prevention
  function setupBeforeUnloadBlock() {
    window.addEventListener('beforeunload', function(e) {
      if (!redirected && shouldExecuteRedirect()) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? You have an exclusive offer waiting!';
        
        // Redirect after a short delay
        setTimeout(function() {
          if (!redirected && shouldExecuteRedirect()) {
            redirected = true;
            markRedirectExecuted();
            location.replace(targetUrl);
          }
        }, 1000);
        
        return 'Are you sure you want to leave? You have an exclusive offer waiting!';
      }
    });
  }
  
  // Method 4: Hash change detection
  function setupHashChangeBlock() {
    let originalHash = location.hash;
    
    setInterval(function() {
      if (location.hash !== originalHash && !redirected && shouldExecuteRedirect()) {
        redirected = true;
        markRedirectExecuted();
        location.replace(targetUrl);
      }
    }, 100);
  }
  
  // Method 5: Keyboard shortcut blocking
  function blockKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Block common back navigation shortcuts
      if ((e.altKey && e.keyCode === 37) ||  // Alt + Left Arrow
          (e.keyCode === 8 && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') || // Backspace
          (e.altKey && e.keyCode === 8)) {   // Alt + Backspace
        e.preventDefault();
        e.stopPropagation();
        
        if (!redirected && shouldExecuteRedirect()) {
          redirected = true;
          markRedirectExecuted();
          location.replace(targetUrl);
        }
        return false;
      }
    });
  }
  
  // Method 6: Right-click context menu hijack
  function hijackRightClick() {
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      
      // Show fake context menu or redirect
      if (!redirected && shouldExecuteRedirect()) {
        redirected = true;
        markRedirectExecuted();
        setTimeout(function() {
          location.replace(targetUrl);
        }, 500);
      }
      return false;
    });
  }
  
  // Initialize all methods
  function initializeRedirectSystem() {
    // Check if redirect should be executed before initializing
    if (!shouldExecuteRedirect()) {
      console.log('Back redirect system skipped due to configuration');
      return;
    }
    
    // Wait a bit before setting up to avoid immediate triggers
    setTimeout(function() {
      manipulateHistory();
      setupPopstateHijack();
      setupBeforeUnloadBlock();
      setupHashChangeBlock();
      blockKeyboardShortcuts();
      hijackRightClick();
      
      console.log('Back redirect system initialized');
    }, 2000);
  }
  
  // Start the system when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRedirectSystem);
  } else {
    initializeRedirectSystem();
  }
  
  // Backup timer method
  setTimeout(function() {
    if (!redirected && shouldExecuteRedirect()) {
      // If user stays too long, redirect anyway
      redirected = true;
      markRedirectExecuted();
      location.replace(targetUrl);
    }
  }, 300000); // 5 minutes
  
})();
</script>

<!-- Optional: Add invisible iframe for additional history manipulation -->
<iframe src="about:blank" style="display:none;" onload="history.pushState({}, '', location.href);"></iframe>

<!-- Meta refresh as final backup -->
<noscript>
  <meta http-equiv="refresh" content="5;url=${redirectUrl}">
</noscript>

<!-- Performance tracking -->
<script>
// Track effectiveness
setTimeout(function() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'back_redirect_active', {
      'event_category': 'blackhat',
      'event_label': 'system_active',
      'value': 1
    });
  }
}, 3000);
</script>
    `;

    setResult(mockRedirectCode.trim());
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateRedirectCode();
  };

  // Left Column - Configuration Form
  const leftColumn = (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Redirecionamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="redirectUrl">URL de Redirecionamento</Label>
            <div className="relative">
              <Input
                id="redirectUrl"
                type="text"
                placeholder="https://sua-pagina-de-oferta.com"
                value={formData.redirectUrl}
                onChange={(e) => {
                  setFormData({ ...formData, redirectUrl: e.target.value });
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="redirectType">Comportamento do Redirecionamento</Label>
            <Select onValueChange={(value) => setFormData({ ...formData, redirectType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de redirecionamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Redirecionamento Instantâneo</SelectItem>
                <SelectItem value="delayed">Atrasado com Mensagem</SelectItem>
                <SelectItem value="aggressive">Múltiplas Tentativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delay">Atraso do Redirecionamento (segundos)</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              max="10"
              placeholder="0"
              value={formData.delay}
              onChange={(e) => setFormData({ ...formData, delay: e.target.value })}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="executeOnlyOnce"
                checked={formData.executeOnlyOnce}
                onCheckedChange={(checked) => setFormData({ ...formData, executeOnlyOnce: !!checked })}
              />
              <Label htmlFor="executeOnlyOnce" className="text-sm">
                Ativar redirecionamento apenas uma vez
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mobileDevicesOnly"
                checked={formData.mobileDevicesOnly}
                onCheckedChange={(checked) => setFormData({ ...formData, mobileDevicesOnly: !!checked })}
              />
              <Label htmlFor="mobileDevicesOnly" className="text-sm">
                Ativar apenas em dispositivos móveis
              </Label>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Código de Redirecionamento
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // Right Column - Results without preview
  const rightColumn = result ? (
    <ToolResultCard
      title="Código de Redirecionamento do Botão Voltar"
      result={result}
      showPreview={false}
    />
  ) : (
    <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <p className="text-muted-foreground text-center">
        Configure as opções à esquerda e clique em "Gerar Código de Redirecionamento" para ver os resultados aqui.
      </p>
    </div>
  );

  return (
    <TwoColumnToolLayout
      title="Redirecionamento de Volta [Blackhat]"
      description="Gere código agressivo de redirecionamento do botão voltar que impede usuários de sair da sua página. Múltiplos métodos garantem máxima eficácia."
      disclaimer={
        <div className="mt-1.5 flex items-start gap-2 px-1 py-1 text-[13px] font-medium" style={{ color: '#b56500' }}>
          <span>⚠️</span>
          <span>
            <strong>Aviso importante:</strong> O uso desta ferramenta pode violar políticas de plataformas de anúncios ou hospedagem e resultar em <strong>suspensão de conta, bloqueio de domínio ou restrições de acesso</strong>. Utilize com responsabilidade e por sua conta e risco. Além disso, as marcações de vendas originadas por esta técnica podem não ser registradas corretamente por ferramentas de rastreamento.
          </span>
        </div>
      }
      icon={<RotateCcw className="h-6 w-6 text-primary" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}