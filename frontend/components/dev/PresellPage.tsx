import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDevPreviewGate } from "@/lib/devPreviewGate";
import { DevPreviewBanner } from "./DevPreviewBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Eye, Copy, RotateCcw, Loader2 } from "lucide-react";

interface PresellFormData {
  produto: string;
  promessa: string;
  beneficios: string;
  cta: string;
  cupom: boolean;
  freteGratis: boolean;
  verificacaoIdade: boolean;
}

const INITIAL_FORM_DATA: PresellFormData = {
  produto: "",
  promessa: "",
  beneficios: "",
  cta: "Quero Aproveitar Agora",
  cupom: false,
  freteGratis: false,
  verificacaoIdade: false,
};

function generatePresellHTML(data: PresellFormData): string {
  const beneficiosList = data.beneficios
    .split("\n")
    .filter((b) => b.trim())
    .map((b) => `    <li>${b.trim()}</li>`)
    .join("\n");

  const cupomSection = data.cupom
    ? `    <div class="cupom">
      <p>🎉 <strong>Cupom liberado:</strong> Use o código <code>APLICAR10</code> e ganhe 10% de desconto!</p>
    </div>`
    : "";

  const freteSection = data.freteGratis
    ? `    <div class="frete">
      <p>🚚 <strong>Frete grátis</strong> por tempo limitado!</p>
    </div>`
    : "";

  const idadeModal = data.verificacaoIdade
    ? `
  <div id="age-modal" class="modal">
    <div class="modal-content">
      <h2>Verificação de Idade</h2>
      <p>Este produto é destinado apenas para maiores de 18 anos.</p>
      <button onclick="confirmAge()">Sou maior de 18</button>
      <button onclick="exitSite()">Sair</button>
    </div>
  </div>

  <script>
    function confirmAge() {
      document.getElementById('age-modal').style.display = 'none';
    }
    function exitSite() {
      window.location.href = 'https://www.google.com';
    }
    window.onload = function() {
      const ageVerified = localStorage.getItem('ageVerified');
      if (!ageVerified) {
        document.getElementById('age-modal').style.display = 'flex';
      }
      document.querySelector('button[onclick="confirmAge()"]').addEventListener('click', function() {
        localStorage.setItem('ageVerified', 'true');
      });
    };
  </script>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.produto} — Presell</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 20px;
      color: #222;
      text-align: center;
    }
    ul {
      list-style: none;
      margin: 20px 0;
    }
    li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
      font-size: 1.05rem;
      line-height: 1.6;
    }
    li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 1.2rem;
    }
    .cupom, .frete {
      background: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .cupom code {
      background: #667eea;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    button.cta {
      background: #667eea;
      color: white;
      border: none;
      padding: 18px 40px;
      font-size: 1.2rem;
      font-weight: bold;
      border-radius: 50px;
      cursor: pointer;
      width: 100%;
      margin-top: 30px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    button.cta:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .modal-content h2 {
      margin-bottom: 15px;
      color: #222;
    }
    .modal-content p {
      margin-bottom: 25px;
      color: #666;
    }
    .modal-content button {
      margin: 5px;
      padding: 12px 30px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s;
    }
    .modal-content button:first-of-type {
      background: #667eea;
      color: white;
    }
    .modal-content button:first-of-type:hover {
      background: #5568d3;
    }
    .modal-content button:last-of-type {
      background: #e0e0e0;
      color: #333;
    }
    .modal-content button:last-of-type:hover {
      background: #d0d0d0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.produto}: ${data.promessa}</h1>
    <ul>
${beneficiosList}
    </ul>
${cupomSection}
${freteSection}
    <button class="cta">${data.cta}</button>
  </div>${idadeModal}
  <script>
    console.log('Dev Preview – Presell Builder');
  </script>
</body>
</html>`;
}

function RestrictedAccessPage({ reason }: { reason: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Alert>
            <AlertDescription>{reason}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PresellPage() {
  const { allowed, reason } = useDevPreviewGate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<PresellFormData>(INITIAL_FORM_DATA);
  const [generatedHTML, setGeneratedHTML] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("presellDraft");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, []);

  useEffect(() => {
    if (formData !== INITIAL_FORM_DATA) {
      localStorage.setItem("presellDraft", JSON.stringify(formData));
    }
  }, [formData]);

  if (!allowed) {
    return <RestrictedAccessPage reason={reason || "Acesso negado."} />;
  }

  const handleInputChange = (
    field: keyof PresellFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    if (!formData.produto.trim()) {
      toast({
        title: "Erro",
        description: "O campo Produto é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.promessa.trim()) {
      toast({
        title: "Erro",
        description: "O campo Promessa é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.beneficios.trim()) {
      toast({
        title: "Erro",
        description: "O campo Benefícios é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const html = generatePresellHTML(formData);
      setGeneratedHTML(html);
      setIsGenerating(false);
      toast({
        title: "Preview gerado!",
        description: "O HTML da presell foi gerado com sucesso.",
      });
    }, 500);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setGeneratedHTML("");
    localStorage.removeItem("presellDraft");
    toast({
      title: "Resetado",
      description: "Formulário e preview foram limpos.",
    });
  };

  const handleCopyHTML = async () => {
    if (!generatedHTML) {
      toast({
        title: "Nada para copiar",
        description: "Gere um preview primeiro.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedHTML);
      toast({
        title: "HTML copiado!",
        description: "O código HTML foi copiado para a área de transferência.",
      });
    } catch (error) {
      console.error("Failed to copy HTML", error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o HTML.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-3xl font-bold">Presell Builder</h1>
          <Badge variant="secondary">Dev Preview</Badge>
        </div>

        <DevPreviewBanner />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="produto">Produto *</Label>
                <Input
                  id="produto"
                  value={formData.produto}
                  onChange={(e) => handleInputChange("produto", e.target.value)}
                  placeholder="Ex: Óleo de Cannabis Premium"
                />
              </div>

              <div>
                <Label htmlFor="promessa">Promessa *</Label>
                <Input
                  id="promessa"
                  value={formData.promessa}
                  onChange={(e) => handleInputChange("promessa", e.target.value)}
                  placeholder="Ex: Alívio Natural e Eficaz"
                />
              </div>

              <div>
                <Label htmlFor="beneficios">Benefícios (um por linha) *</Label>
                <Textarea
                  id="beneficios"
                  value={formData.beneficios}
                  onChange={(e) => handleInputChange("beneficios", e.target.value)}
                  placeholder="Reduz ansiedade e estresse&#10;100% natural e orgânico&#10;Certificado e testado"
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="cta">Texto do CTA</Label>
                <Input
                  id="cta"
                  value={formData.cta}
                  onChange={(e) => handleInputChange("cta", e.target.value)}
                  placeholder="Quero Aproveitar Agora"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cupom">Exibir Cupom de Desconto</Label>
                  <Switch
                    id="cupom"
                    checked={formData.cupom}
                    onCheckedChange={(checked) => handleInputChange("cupom", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="frete">Exibir Frete Grátis</Label>
                  <Switch
                    id="frete"
                    checked={formData.freteGratis}
                    onCheckedChange={(checked) =>
                      handleInputChange("freteGratis", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="idade">Verificação de Idade (+18)</Label>
                  <Switch
                    id="idade"
                    checked={formData.verificacaoIdade}
                    onCheckedChange={(checked) =>
                      handleInputChange("verificacaoIdade", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Gerar Preview
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resultado</CardTitle>
              {generatedHTML && (
                <Button onClick={handleCopyHTML} variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar HTML
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!generatedHTML ? (
                <div className="h-96 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                  Clique em "Gerar Preview" para visualizar
                </div>
              ) : (
                <Tabs defaultValue="preview">
                  <TabsList className="w-full">
                    <TabsTrigger value="preview" className="flex-1">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="html" className="flex-1">
                      HTML
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="mt-4">
                    <iframe
                      srcDoc={generatedHTML}
                      className="w-full h-96 border rounded-lg"
                      title="Presell Preview"
                    />
                  </TabsContent>

                  <TabsContent value="html" className="mt-4">
                    <Textarea
                      value={generatedHTML}
                      readOnly
                      className="font-mono text-xs h-96 resize-none"
                    />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
