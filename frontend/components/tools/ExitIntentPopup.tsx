import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle, Copy, Download, Upload, Link as LinkIcon, Bold, Underline, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TwoColumnToolLayout from './TwoColumnToolLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';

interface FormattedText {
  text: string;
  formats: {
    bold?: boolean;
    underline?: boolean;
  };
}

export default function ExitIntentPopup() {
  useCompleteScrollToTop();

  const [result, setResult] = useState<string>('');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const { toast } = useToast();

  const DEFAULT_TITLE_COLOR = '#E74C3C';

  const [formData, setFormData] = useState({
    titulo: 'Espere! Não Saia Ainda!',
    tituloFormatado: [] as FormattedText[],
    corTitulo: DEFAULT_TITLE_COLOR,
    mensagem: 'Ganhe 50% de desconto exclusivo antes de sair! Esta oferta expira em 10 minutos.',
    mensagemFormatada: [] as FormattedText[],
    textoBotao: 'Resgatar Desconto',
    urlBotao: 'https://exemplo.com/oferta',
    corFundoBotao: '#e74c3c',
    corTextoBotao: '#ffffff',
    corFundoPopup: '#ffffff',
    corTexto: '#333333',
    imagemUrl: '',
    posicaoImagem: 'acima',
    bordaArredondada: 15,
    larguraMaxima: '500px',
    fonte: 'Inter',
    delayReativar: 0,
    ativarMobile: true,
    condicaoAtivacao: 'exit-intent',
    inativiadeSegundos: 5
  });

  const tituloInputRef = useRef<HTMLInputElement>(null);
  const mensagemTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    generatePopupCode();
  }, [formData]);

  const applyFormatToSelection = (field: 'titulo' | 'mensagem', format: 'bold' | 'underline') => {
    const inputRef = field === 'titulo' ? tituloInputRef.current : mensagemTextareaRef.current;
    if (!inputRef) return;

    const start = inputRef.selectionStart || 0;
    const end = inputRef.selectionEnd || 0;
    
    if (start === end) {
      toast({ 
        title: "Nenhum texto selecionado", 
        description: "Selecione o texto que deseja formatar.",
        variant: "destructive" 
      });
      return;
    }

    const text = field === 'titulo' ? formData.titulo : formData.mensagem;
    const selectedText = text.substring(start, end);

    const formatKey = field === 'titulo' ? 'tituloFormatado' : 'mensagemFormatada';
    const currentFormats = [...formData[formatKey]];

    const existingIndex = currentFormats.findIndex(f => f.text === selectedText);
    
    if (existingIndex >= 0) {
      const existing = currentFormats[existingIndex];
      currentFormats[existingIndex] = {
        ...existing,
        formats: {
          ...existing.formats,
          [format]: !existing.formats[format]
        }
      };
      
      if (!currentFormats[existingIndex].formats.bold && 
          !currentFormats[existingIndex].formats.underline) {
        currentFormats.splice(existingIndex, 1);
      }
    } else {
      currentFormats.push({
        text: selectedText,
        formats: { [format]: true }
      });
    }

    setFormData({
      ...formData,
      [formatKey]: currentFormats
    });

    toast({ 
      title: "Formatação aplicada!", 
      description: `Texto "${selectedText}" formatado com sucesso.` 
    });
  };

  const renderFormattedText = (text: string, formats: FormattedText[]) => {
    if (!formats || formats.length === 0) return text;

    let result = text;
    const sortedFormats = [...formats].sort((a, b) => {
      const aIndex = text.indexOf(a.text);
      const bIndex = text.indexOf(b.text);
      return bIndex - aIndex;
    });

    sortedFormats.forEach(({ text: formattedText, formats: fmt }) => {
      let style = '';
      if (fmt.bold) style += 'font-weight: bold;';
      if (fmt.underline) style += 'text-decoration: underline;';
      
      const replacement = `<span style="${style}">${formattedText}</span>`;
      result = result.replace(formattedText, replacement);
    });

    return result;
  };

  const renderFormattedTextForPreview = (text: string, formats: FormattedText[]) => {
    if (!formats || formats.length === 0) return <>{text}</>;

    const sortedFormats = [...formats].sort((a, b) => {
      const aIndex = text.indexOf(a.text);
      const bIndex = text.indexOf(b.text);
      return aIndex - bIndex;
    });

    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    sortedFormats.forEach(({ text: formattedText, formats: fmt }) => {
      const startIndex = text.indexOf(formattedText, currentIndex);
      if (startIndex === -1) return;

      if (startIndex > currentIndex) {
        parts.push(text.substring(currentIndex, startIndex));
      }

      const style: React.CSSProperties = {};
      if (fmt.bold) style.fontWeight = 'bold';
      if (fmt.underline) style.textDecoration = 'underline';

      parts.push(
        <span key={startIndex} style={style}>
          {formattedText}
        </span>
      );

      currentIndex = startIndex + formattedText.length;
    });

    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return <>{parts}</>;
  };

  const generatePopupCode = () => {
    const {
      titulo,
      tituloFormatado,
      corTitulo,
      mensagem,
      mensagemFormatada,
      textoBotao,
      urlBotao,
      corFundoBotao,
      corTextoBotao,
      corFundoPopup,
      corTexto,
      imagemUrl,
      posicaoImagem,
      bordaArredondada,
      larguraMaxima,
      fonte,
      delayReativar,
      ativarMobile,
      condicaoAtivacao,
      inativiadeSegundos
    } = formData;

    const tituloHtml = renderFormattedText(titulo, tituloFormatado);
    const mensagemHtml = renderFormattedText(mensagem, mensagemFormatada);

    const imageHtml = imagemUrl && posicaoImagem !== 'sem-imagem'
      ? `<img src="${imagemUrl}" alt="Popup" class="exit-popup-image" />`
      : '';

    const layoutClass = posicaoImagem === 'esquerda' || posicaoImagem === 'direita' ? 'exit-popup-horizontal' : '';
    const imagePosition = posicaoImagem === 'esquerda' ? 'order: -1;' : '';

    const activationCondition = condicaoAtivacao === 'exit-intent'
      ? `if (e.clientY <= 0 && !exitPopupShown && timeOnPage >= ${delayReativar}) { showExitPopup(); }`
      : condicaoAtivacao === 'tentar-fechar'
      ? `if (!exitPopupShown && timeOnPage >= ${delayReativar}) { e.preventDefault(); showExitPopup(); return ''; }`
      : `if (!exitPopupShown && timeOnPage >= ${inativiadeSegundos}) { showExitPopup(); }`;

    const eventType = condicaoAtivacao === 'exit-intent' ? 'mouseleave' : condicaoAtivacao === 'tentar-fechar' ? 'beforeunload' : null;

    const code = `
<!-- Exit Intent Popup - Blackhat Edition -->
<style>
.exit-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999999;
  display: none;
  backdrop-filter: blur(5px);
  align-items: center;
  justify-content: center;
}

.exit-popup {
  background: ${corFundoPopup};
  padding: 30px;
  border-radius: ${bordaArredondada}px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  max-width: ${larguraMaxima};
  width: 90%;
  text-align: center;
  animation: popupSlide 0.5s ease-out;
  position: relative;
  font-family: '${fonte}', sans-serif;
}

.exit-popup-horizontal {
  display: flex;
  align-items: center;
  gap: 20px;
  text-align: left;
}

@keyframes popupSlide {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.exit-popup h2 {
  color: ${corTitulo};
  font-size: 28px;
  margin-bottom: 15px;
}

.exit-popup p {
  color: ${corTexto};
  font-size: 18px;
  margin-bottom: 25px;
  line-height: 1.5;
}

.exit-popup-btn {
  background: ${corFundoBotao};
  color: ${corTextoBotao};
  border: none;
  padding: 15px 30px;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
  text-decoration: none;
  display: inline-block;
}

.exit-popup-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 ${corFundoBotao}B3; }
  70% { box-shadow: 0 0 0 10px ${corFundoBotao}00; }
  100% { box-shadow: 0 0 0 0 ${corFundoBotao}00; }
}

.close-popup {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.exit-popup-image {
  max-width: ${posicaoImagem === 'esquerda' || posicaoImagem === 'direita' ? '200px' : '100%'};
  height: auto;
  border-radius: 8px;
  ${imagePosition}
}

@media (max-width: 600px) {
  .exit-popup {
    padding: 20px;
    margin: 20px;
  }
  .exit-popup h2 { font-size: 24px; }
  .exit-popup p { font-size: 16px; }
  .exit-popup-horizontal {
    flex-direction: column;
  }
  ${!ativarMobile ? '.exit-popup-overlay { display: none !important; }' : ''}
}
</style>

<div id="exitPopupOverlay" class="exit-popup-overlay">
  <div class="exit-popup ${layoutClass}">
    <button class="close-popup" onclick="closeExitPopup()">&times;</button>
    ${posicaoImagem === 'acima' ? imageHtml : ''}
    <div>
      <h2>${tituloHtml}</h2>
      ${posicaoImagem === 'abaixo' ? imageHtml : ''}
      <p>${mensagemHtml}</p>
      <a href="${urlBotao}" class="exit-popup-btn" onclick="trackConversion()">${textoBotao}</a>
    </div>
    ${posicaoImagem === 'esquerda' || posicaoImagem === 'direita' ? imageHtml : ''}
  </div>
</div>

<script>
let exitPopupShown = false;
let timeOnPage = 0;

setInterval(() => {
  timeOnPage++;
}, 1000);

${eventType ? `
document.addEventListener('${eventType}', function(e) {
  ${activationCondition}
});
` : ''}

${condicaoAtivacao === 'inatividade' ? `
let inactivityTimer;
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    ${activationCondition}
  }, ${inativiadeSegundos * 1000});
}
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
resetInactivityTimer();
` : ''}

function showExitPopup() {
  if (!exitPopupShown) {
    exitPopupShown = true;
    document.getElementById('exitPopupOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    ${delayReativar > 0 ? `
    setTimeout(() => {
      exitPopupShown = false;
    }, ${delayReativar * 1000});
    ` : ''}
  }
}

function closeExitPopup() {
  document.getElementById('exitPopupOverlay').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function trackConversion() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'exit_intent_conversion', {
      'event_category': 'conversion',
      'event_label': 'exit_intent'
    });
  }
}

document.getElementById('exitPopupOverlay').addEventListener('click', function(e) {
  if (e.target === this) {
    closeExitPopup();
  }
});
</script>
    `;

    setResult(code.trim());
  };

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
      setIsCopying(false);
      toast({ title: "Erro", description: "Não foi possível copiar o código.", variant: "destructive" });
    }
  };

  const copyColorToClipboard = async (color: string, id: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(id);
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
    a.download = 'exit-intent-popup.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Arquivo exportado!", description: "O código foi exportado como arquivo TXT." });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imagemUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      let imageFound = false;

      for (const item of clipboardItems) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types.find(t => t.startsWith('image/')) || '');
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData({ ...formData, imagemUrl: reader.result as string });
            toast({ title: "Imagem colada!", description: "Imagem da área de transferência carregada com sucesso." });
          };
          reader.readAsDataURL(blob);
          imageFound = true;
          break;
        }
      }

      if (!imageFound) {
        const text = await navigator.clipboard.readText();
        if (text.startsWith('http://') || text.startsWith('https://')) {
          setFormData({ ...formData, imagemUrl: text });
          toast({ title: "URL colada!", description: "URL da imagem colada com sucesso." });
        } else {
          toast({ title: "Erro", description: "Nenhuma imagem ou URL válida encontrada na área de transferência.", variant: "destructive" });
        }
      }
    } catch (err) {
      console.error('Erro ao colar imagem:', err);
      toast({ title: "Erro", description: "Não foi possível colar a imagem. Tente copiar novamente.", variant: "destructive" });
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imagemUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetTitleColor = () => {
    setFormData({ ...formData, corTitulo: DEFAULT_TITLE_COLOR });
    toast({ title: "Cor redefinida", description: "A cor do título foi redefinida para o padrão." });
  };

  const PopupPreview = () => {
    const {
      titulo,
      tituloFormatado,
      corTitulo,
      mensagem,
      mensagemFormatada,
      textoBotao,
      corFundoBotao,
      corTextoBotao,
      corFundoPopup,
      corTexto,
      imagemUrl,
      posicaoImagem,
      bordaArredondada,
      larguraMaxima,
      fonte
    } = formData;

    const showImage = imagemUrl && posicaoImagem !== 'sem-imagem';
    const isHorizontal = posicaoImagem === 'esquerda' || posicaoImagem === 'direita';

    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Preview</h3>
        <div className="bg-gray-900/80 p-8 rounded-lg flex items-center justify-center min-h-[300px]">
          <div
            className={`relative ${isHorizontal ? 'flex items-center gap-5' : ''}`}
            style={{
              background: corFundoPopup,
              padding: '30px',
              borderRadius: `${bordaArredondada}px`,
              maxWidth: larguraMaxima,
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              fontFamily: `${fonte}, sans-serif`,
              textAlign: isHorizontal ? 'left' : 'center'
            }}
          >
            <button className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-600 cursor-pointer border-0 bg-transparent">
              &times;
            </button>
            {showImage && posicaoImagem === 'acima' && (
              <img
                src={imagemUrl}
                alt="Popup"
                className="mb-4"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
              />
            )}
            {showImage && posicaoImagem === 'esquerda' && (
              <img
                src={imagemUrl}
                alt="Popup"
                style={{ maxWidth: '200px', height: 'auto', borderRadius: '8px', order: -1 }}
              />
            )}
            <div>
              <h2 style={{ color: corTitulo, fontSize: '28px', marginBottom: '15px' }}>
                {renderFormattedTextForPreview(titulo, tituloFormatado)}
              </h2>
              {showImage && posicaoImagem === 'abaixo' && (
                <img
                  src={imagemUrl}
                  alt="Popup"
                  className="mb-4"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                />
              )}
              <p style={{ color: corTexto, fontSize: '18px', marginBottom: '25px', lineHeight: '1.5' }}>
                {renderFormattedTextForPreview(mensagem, mensagemFormatada)}
              </p>
              <button
                style={{
                  background: corFundoBotao,
                  color: corTextoBotao,
                  border: 'none',
                  padding: '15px 30px',
                  fontSize: '18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {textoBotao}
              </button>
            </div>
            {showImage && posicaoImagem === 'direita' && (
              <img
                src={imagemUrl}
                alt="Popup"
                style={{ maxWidth: '200px', height: 'auto', borderRadius: '8px' }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const leftColumn = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              ref={tituloInputRef}
              id="titulo"
              placeholder="Espere! Não Saia Ainda!"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyFormatToSelection('titulo', 'bold')}
                className="flex items-center gap-1"
              >
                <Bold className="h-4 w-4" />
                Negrito
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyFormatToSelection('titulo', 'underline')}
                className="flex items-center gap-1"
              >
                <Underline className="h-4 w-4" />
                Sublinhado
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Selecione o texto e clique nos botões para formatar</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              ref={mensagemTextareaRef}
              id="mensagem"
              placeholder="Ganhe 50% de desconto exclusivo..."
              value={formData.mensagem}
              onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyFormatToSelection('mensagem', 'bold')}
                className="flex items-center gap-1"
              >
                <Bold className="h-4 w-4" />
                Negrito
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyFormatToSelection('mensagem', 'underline')}
                className="flex items-center gap-1"
              >
                <Underline className="h-4 w-4" />
                Sublinhado
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Selecione o texto e clique nos botões para formatar</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="textoBotao">Texto do botão</Label>
            <Input
              id="textoBotao"
              placeholder="Resgatar Desconto"
              value={formData.textoBotao}
              onChange={(e) => setFormData({ ...formData, textoBotao: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urlBotao">URL do botão</Label>
            <Input
              id="urlBotao"
              type="url"
              placeholder="https://exemplo.com/oferta"
              value={formData.urlBotao}
              onChange={(e) => setFormData({ ...formData, urlBotao: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cor de fundo do botão</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={formData.corFundoBotao}
                onChange={(e) => setFormData({ ...formData, corFundoBotao: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={formData.corFundoBotao}
                onChange={(e) => setFormData({ ...formData, corFundoBotao: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyColorToClipboard(formData.corFundoBotao, 'btn-bg')}
                className="px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {copiedColor === 'btn-bg' && (
                <span className="text-sm text-green-600 whitespace-nowrap">Copiado!</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor do texto do botão</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={formData.corTextoBotao}
                onChange={(e) => setFormData({ ...formData, corTextoBotao: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={formData.corTextoBotao}
                onChange={(e) => setFormData({ ...formData, corTextoBotao: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyColorToClipboard(formData.corTextoBotao, 'btn-text')}
                className="px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {copiedColor === 'btn-text' && (
                <span className="text-sm text-green-600 whitespace-nowrap">Copiado!</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor de fundo do popup</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={formData.corFundoPopup}
                onChange={(e) => setFormData({ ...formData, corFundoPopup: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={formData.corFundoPopup}
                onChange={(e) => setFormData({ ...formData, corFundoPopup: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyColorToClipboard(formData.corFundoPopup, 'popup-bg')}
                className="px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {copiedColor === 'popup-bg' && (
                <span className="text-sm text-green-600 whitespace-nowrap">Copiado!</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor do texto (mensagem)</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={formData.corTexto}
                onChange={(e) => setFormData({ ...formData, corTexto: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={formData.corTexto}
                onChange={(e) => setFormData({ ...formData, corTexto: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyColorToClipboard(formData.corTexto, 'text')}
                className="px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {copiedColor === 'text' && (
                <span className="text-sm text-green-600 whitespace-nowrap">Copiado!</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cor do título</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetTitleColor}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Redefinir cor
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={formData.corTitulo}
                onChange={(e) => setFormData({ ...formData, corTitulo: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={formData.corTitulo}
                onChange={(e) => setFormData({ ...formData, corTitulo: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyColorToClipboard(formData.corTitulo, 'title')}
                className="px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {copiedColor === 'title' && (
                <span className="text-sm text-green-600 whitespace-nowrap">Copiado!</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagem do Popup</Label>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="URL da imagem"
                value={formData.imagemUrl}
                onChange={(e) => setFormData({ ...formData, imagemUrl: e.target.value })}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImagePaste}
                  className="flex-1"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Colar
                </Button>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center text-sm text-muted-foreground"
              >
                Arraste e solte uma imagem aqui
              </div>
              {formData.imagemUrl && (
                <img
                  src={formData.imagemUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Posição da Imagem</Label>
            <Select value={formData.posicaoImagem} onValueChange={(value) => setFormData({ ...formData, posicaoImagem: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acima">Acima do título</SelectItem>
                <SelectItem value="abaixo">Abaixo do título</SelectItem>
                <SelectItem value="esquerda">À esquerda do título</SelectItem>
                <SelectItem value="direita">À direita do título</SelectItem>
                <SelectItem value="sem-imagem">Sem imagem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Borda arredondada: {formData.bordaArredondada}px</Label>
            <Slider
              value={[formData.bordaArredondada]}
              onValueChange={([value]) => setFormData({ ...formData, bordaArredondada: value })}
              min={0}
              max={30}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Largura máxima</Label>
            <Select value={formData.larguraMaxima} onValueChange={(value) => setFormData({ ...formData, larguraMaxima: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="400px">400px</SelectItem>
                <SelectItem value="500px">500px</SelectItem>
                <SelectItem value="600px">600px</SelectItem>
                <SelectItem value="700px">700px</SelectItem>
                <SelectItem value="80%">80%</SelectItem>
                <SelectItem value="100%">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fonte</Label>
            <Select value={formData.fonte} onValueChange={(value) => setFormData({ ...formData, fonte: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comportamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Delay para reativar (segundos)</Label>
            <Input
              type="number"
              min="0"
              value={formData.delayReativar}
              onChange={(e) => setFormData({ ...formData, delayReativar: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ativarMobile"
              checked={formData.ativarMobile}
              onCheckedChange={(checked) => setFormData({ ...formData, ativarMobile: checked as boolean })}
            />
            <Label htmlFor="ativarMobile" className="cursor-pointer">Ativar em mobile</Label>
          </div>

          <div className="space-y-2">
            <Label>Condição de ativação</Label>
            <Select value={formData.condicaoAtivacao} onValueChange={(value) => setFormData({ ...formData, condicaoAtivacao: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exit-intent">Exit intent (mouse sai pelo topo)</SelectItem>
                <SelectItem value="tentar-fechar">Tentar fechar aba</SelectItem>
                <SelectItem value="inatividade">Inatividade por X segundos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.condicaoAtivacao === 'inatividade' && (
            <div className="space-y-2">
              <Label>Segundos de inatividade</Label>
              <Input
                type="number"
                min="1"
                value={formData.inativiadeSegundos}
                onChange={(e) => setFormData({ ...formData, inativiadeSegundos: parseInt(e.target.value) || 5 })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      <PopupPreview />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Código Gerado</CardTitle>
          <div className="flex gap-2 relative">
            {showCopiedPopup && (
              <div className="absolute -top-10 left-0 bg-emerald-500 text-white text-[13px] px-3 py-1.5 rounded-md shadow-lg animate-in fade-in zoom-in duration-200">
                Copiado!
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(result)}
              disabled={isCopying}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={exportToTxt}>
              <Download className="h-4 w-4 mr-1" />
              Exportar TXT
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <TwoColumnToolLayout
      title="Popup de Intenção de Saída [Blackhat]"
      description="Gere código agressivo de popup de intenção de saída com múltiplos métodos de disparo para capturar visitantes que estão saindo. Use responsavelmente e considere a experiência do usuário."
      disclaimer={
        <div className="mt-1.5 flex items-start gap-2 px-1 py-1 text-[13px] font-medium" style={{ color: '#b56500' }}>
          <span>⚠️</span>
          <span>
            <strong>Aviso importante:</strong> O uso desta ferramenta pode violar políticas de plataformas de anúncios ou hospedagem e resultar em <strong>suspensão de conta, bloqueio de domínio ou restrições de acesso</strong>. Utilize com responsabilidade e por sua conta e risco. Além disso, as marcações de vendas originadas por esta técnica podem não ser registradas corretamente por ferramentas de rastreamento.
          </span>
        </div>
      }
      icon={<AlertTriangle className="h-6 w-6 text-primary" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}