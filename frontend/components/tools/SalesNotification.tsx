import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bell, AlertCircle } from 'lucide-react';
import ToolResultCard from './ToolResultCard';
import TwoColumnToolLayout from './TwoColumnToolLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';
import SalesNotificationPreview from './SalesNotificationPreview';

interface FormData {
  demo: boolean;
  requireConsent: boolean;
  position: 'left' | 'right';
  displayMs: number;
  minInterval: number;
  maxInterval: number;
  maxShows: number;
  respectSessionClose: boolean;
  themeBg: string;
  themeText: string;
  productName: string;
  productImg: string;
  messages: string;
  agoMin: number;
  agoMax: number;
  names: string;
  cities: string;
}

export default function SalesNotification() {
  useCompleteScrollToTop();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  
  const [formData, setFormData] = useState<FormData>({
    demo: true,
    requireConsent: false,
    position: 'left',
    displayMs: 4800,
    minInterval: 3000,
    maxInterval: 10000,
    maxShows: 99,
    respectSessionClose: true,
    themeBg: '#0f172a',
    themeText: '#ffffff',
    productName: 'Prodentim',
    productImg: 'https://prodentim101.com//statics/img/introducting_prodentim.png?',
    messages: 'Ordered 3 bottles\nOrdered 6 bottles',
    agoMin: 1,
    agoMax: 7,
    names: 'Michael R.\nSarah L.\nJames K.\nEmily T.\nDaniel S.\nOlivia C.\nWilliam B.\nSophia M.\nBenjamin H.\nAva P.\nLucas J.\nIsabella V.',
    cities: 'Dallas, TX\nChicago, IL\nPhoenix, AZ\nMiami, FL\nNew York, NY\nSan Diego, CA\nAustin, TX\nAtlanta, GA\nSeattle, WA\nDenver, CO'
  });

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError('');
      return false;
    }
    
    const urlPattern = /^https:\/\/.+/i;
    if (!urlPattern.test(url)) {
      setUrlError('Insira uma URL válida, ex.: https://seusite.com/img.png');
      return false;
    }
    
    setUrlError('');
    return true;
  };

  const generateNotificationCode = async () => {
    if (!validateUrl(formData.productImg)) {
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const messagesArray = formData.messages.split('\n').filter(m => m.trim());
    const namesArray = formData.names.split('\n').filter(n => n.trim());
    const citiesArray = formData.cities.split('\n').filter(c => c.trim());

    const messagesJson = JSON.stringify(messagesArray);
    const namesJson = JSON.stringify(namesArray);
    const citiesJson = JSON.stringify(citiesArray);

    const code = `<script>
const DEMO = ${formData.demo};
const REQUIRE_CONSENT = ${formData.requireConsent};
const POSITION = "${formData.position}";
const DISPLAY_MS = ${formData.displayMs};
const MIN_INTERVAL = ${formData.minInterval};
const MAX_INTERVAL = ${formData.maxInterval};
const MAX_SHOWS = ${formData.maxShows};
const RESPECT_SESSION_CLOSE = ${formData.respectSessionClose};

const THEME_BG = "${formData.themeBg}";
const THEME_TEXT = "${formData.themeText}";

const PRODUCT_NAME = "${formData.productName}";
const PRODUCT_IMG = "${formData.productImg}";

const MESSAGES = ${messagesJson};
const AGO_MIN = ${formData.agoMin}, AGO_MAX = ${formData.agoMax};

const NAMES = ${namesJson};
const CITIES = ${citiesJson};

(function() {
  const KEY_CONSENT = "notif_consent";
  const KEY_COUNT = "notif_count";
  const KEY_CLOSED = "notif_closed";

  if (RESPECT_SESSION_CLOSE && sessionStorage.getItem(KEY_CLOSED) === "1") return;

  function hasConsent() {
    if (!REQUIRE_CONSENT) return true;
    return localStorage.getItem(KEY_CONSENT) === "1";
  }

  function incrementCount() {
    const current = parseInt(localStorage.getItem(KEY_COUNT) || "0", 10);
    localStorage.setItem(KEY_COUNT, String(current + 1));
    return current + 1;
  }

  function getCount() {
    return parseInt(localStorage.getItem(KEY_COUNT) || "0", 10);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function createPopup(msg, name, city, ago) {
    const popup = document.createElement("div");
    popup.style.cssText = \`
      position: fixed;
      bottom: 20px;
      \${POSITION}: 20px;
      z-index: 9999;
      background: \${THEME_BG};
      color: \${THEME_TEXT};
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 320px;
      animation: slideIn 0.3s ease-out;
    \`;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = \`
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      color: \${THEME_TEXT};
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
    \`;
    closeBtn.onclick = () => {
      popup.remove();
      if (RESPECT_SESSION_CLOSE) {
        sessionStorage.setItem(KEY_CLOSED, "1");
      }
    };

    const content = document.createElement("div");
    content.style.cssText = "display: flex; align-items: center; gap: 12px;";

    const img = document.createElement("img");
    img.src = PRODUCT_IMG;
    img.alt = PRODUCT_NAME;
    img.style.cssText = "width: 48px; height: 48px; border-radius: 4px; object-fit: cover;";

    const text = document.createElement("div");
    text.style.cssText = "flex: 1; font-size: 14px; line-height: 1.4;";
    text.innerHTML = \`
      <div style="font-weight: 600; margin-bottom: 4px;">\${name}</div>
      <div style="opacity: 0.9;">\${msg}</div>
      <div style="opacity: 0.7; font-size: 12px; margin-top: 4px;">\${city} • \${ago} minute\${ago === 1 ? '' : 's'} ago</div>
    \`;

    content.appendChild(img);
    content.appendChild(text);
    popup.appendChild(closeBtn);
    popup.appendChild(content);

    const style = document.createElement("style");
    style.textContent = \`
      @keyframes slideIn {
        from {
          transform: translateX(\${POSITION === 'left' ? '-' : ''}100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    \`;
    document.head.appendChild(style);

    document.body.appendChild(popup);

    setTimeout(() => {
      popup.style.transition = "opacity 0.3s ease-out";
      popup.style.opacity = "0";
      setTimeout(() => popup.remove(), 300);
    }, DISPLAY_MS);
  }

  function showNotification() {
    if (DEMO || (hasConsent() && getCount() < MAX_SHOWS)) {
      if (!DEMO) incrementCount();
      
      const msg = pick(MESSAGES);
      const name = pick(NAMES);
      const city = pick(CITIES);
      const ago = randomBetween(AGO_MIN, AGO_MAX);

      createPopup(msg, name, city, ago);
    }

    const nextInterval = randomBetween(MIN_INTERVAL, MAX_INTERVAL);
    setTimeout(showNotification, nextInterval);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(showNotification, randomBetween(1000, 3000));
    });
  } else {
    setTimeout(showNotification, randomBetween(1000, 3000));
  }
})();
</script>`;

    setResult(code);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateNotificationCode();
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const leftColumn = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modo Demo</Label>
              <Select 
                value={formData.demo.toString()} 
                onValueChange={(v) => updateFormData('demo', v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativado</SelectItem>
                  <SelectItem value="false">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Requer Consentimento</Label>
              <Select 
                value={formData.requireConsent.toString()} 
                onValueChange={(v) => updateFormData('requireConsent', v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Posição</Label>
              <Select 
                value={formData.position} 
                onValueChange={(v) => updateFormData('position', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Respeitar Fechamento</Label>
              <Select 
                value={formData.respectSessionClose.toString()} 
                onValueChange={(v) => updateFormData('respectSessionClose', v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayMs">Tempo Visível (ms)</Label>
            <Input
              id="displayMs"
              type="number"
              min="1000"
              value={formData.displayMs}
              onChange={(e) => updateFormData('displayMs', parseInt(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minInterval">Intervalo Mín. (ms)</Label>
              <Input
                id="minInterval"
                type="number"
                min="1000"
                value={formData.minInterval}
                onChange={(e) => updateFormData('minInterval', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxInterval">Intervalo Máx. (ms)</Label>
              <Input
                id="maxInterval"
                type="number"
                min="1000"
                value={formData.maxInterval}
                onChange={(e) => updateFormData('maxInterval', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxShows">Máximo de Notificações</Label>
            <Input
              id="maxShows"
              type="number"
              min="1"
              value={formData.maxShows}
              onChange={(e) => updateFormData('maxShows', parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="themeBg">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  id="themeBg"
                  type="color"
                  value={formData.themeBg}
                  onChange={(e) => updateFormData('themeBg', e.target.value)}
                  className="w-16"
                />
                <Input
                  type="text"
                  value={formData.themeBg}
                  onChange={(e) => updateFormData('themeBg', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="themeText">Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  id="themeText"
                  type="color"
                  value={formData.themeText}
                  onChange={(e) => updateFormData('themeText', e.target.value)}
                  className="w-16"
                />
                <Input
                  type="text"
                  value={formData.themeText}
                  onChange={(e) => updateFormData('themeText', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productName">Nome do Produto</Label>
            <Input
              id="productName"
              type="text"
              value={formData.productName}
              onChange={(e) => updateFormData('productName', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productImg">URL da Imagem</Label>
            <Input
              id="productImg"
              type="text"
              placeholder="https://seusite.com/img.png"
              value={formData.productImg}
              onChange={(e) => {
                updateFormData('productImg', e.target.value);
                validateUrl(e.target.value);
              }}
              onBlur={(e) => validateUrl(e.target.value)}
              className={urlError ? 'border-orange-500 focus-visible:ring-orange-500' : ''}
            />
            {urlError && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-600 dark:text-orange-400">{urlError}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensagens e Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="messages">Mensagens (uma por linha)</Label>
            <Textarea
              id="messages"
              rows={3}
              value={formData.messages}
              onChange={(e) => updateFormData('messages', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agoMin">Tempo Atrás Mín. (min)</Label>
              <Input
                id="agoMin"
                type="number"
                min="1"
                value={formData.agoMin}
                onChange={(e) => updateFormData('agoMin', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agoMax">Tempo Atrás Máx. (min)</Label>
              <Input
                id="agoMax"
                type="number"
                min="1"
                value={formData.agoMax}
                onChange={(e) => updateFormData('agoMax', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="names">Nomes (um por linha)</Label>
            <Textarea
              id="names"
              rows={4}
              value={formData.names}
              onChange={(e) => updateFormData('names', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cities">Cidades (uma por linha)</Label>
            <Textarea
              id="cities"
              rows={4}
              value={formData.cities}
              onChange={(e) => updateFormData('cities', e.target.value)}
            />
          </div>

          <Button onClick={generateNotificationCode} className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Código
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      <SalesNotificationPreview
        demo={formData.demo}
        requireConsent={formData.requireConsent}
        position={formData.position}
        displayMs={formData.displayMs}
        minInterval={formData.minInterval}
        maxInterval={formData.maxInterval}
        maxShows={formData.maxShows}
        respectSessionClose={formData.respectSessionClose}
        themeBg={formData.themeBg}
        themeText={formData.themeText}
        productName={formData.productName}
        productImg={formData.productImg}
        messages={formData.messages}
        agoMin={formData.agoMin}
        agoMax={formData.agoMax}
        names={formData.names}
        cities={formData.cities}
      />
      {result ? (
        <ToolResultCard
          title="Código Gerado"
          result={result}
          showPreview={false}
        />
      ) : (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-muted-foreground text-center">
            Configure as opções à esquerda e clique em "Gerar Código" para ver o resultado aqui.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <TwoColumnToolLayout
      title="Notificação de Vendas na Página"
      description="Gere popups de notificação de vendas falsas personalizáveis para aumentar prova social em sua página."
      icon={<Bell className="h-6 w-6 text-primary" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}
