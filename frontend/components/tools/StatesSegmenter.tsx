import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';
import ToolResultCard from './ToolResultCard';
import TwoColumnToolLayout from './TwoColumnToolLayout';
import { useCompleteScrollToTop } from '@/lib/scrollToTop';

const COUNTRY_FILES = {
  "Alemanha": "alemanha.json",
  "Áustria": "austria.json",
  "Austrália": "australia.json",
  "Estados Unidos": "estados-unidos.json",
  "Bélgica": "belgica.json",
  "França": "franca.json",
  "Israel": "israel.json",
  "Suíça": "suica.json"
};

export default function StatesSegmenter() {
  // Apply scroll-to-top on component mount
  useCompleteScrollToTop();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [regions, setRegions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    country: 'Alemanha',
    format: 'list'
  });

  const loadRegionsFor = async (country: string) => {
    try {
      const file = COUNTRY_FILES[country as keyof typeof COUNTRY_FILES];
      if (!file) return;
      
      const response = await fetch(`/data/states/${file}`, { cache: "force-cache" });
      const loadedRegions = await response.json();
      setRegions(loadedRegions);
    } catch (error) {
      console.error('Error loading regions:', error);
      setRegions([]);
    }
  };

  useEffect(() => {
    if (formData.country) {
      loadRegionsFor(formData.country);
    }
  }, [formData.country]);

  const generateStatesData = async () => {
    setIsLoading(true);
    
    try {
      let resultText = '';
      
      if (formData.format === 'list') {
        regions.forEach((region: string) => {
          resultText += `${region}\n`;
        });
      } else if (formData.format === 'csv') {
        resultText = regions.join(', ');
      } else if (formData.format === 'json') {
        resultText = JSON.stringify(regions, null, 2);
      }

      setResult(resultText);
    } catch (error) {
      console.error('Error generating data:', error);
      setResult('Erro ao gerar dados das regiões. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateStatesData();
  };

  const handleCountryChange = (value: string) => {
    setFormData({ ...formData, country: value });
    setResult(''); // Clear previous results when country changes
  };

  // Left Column - Configuration Form
  const leftColumn = (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Segmentação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Selecionar País</Label>
            <Select value={formData.country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um país" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COUNTRY_FILES).map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="format">Formato de Saída</Label>
            <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">Lista</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {regions.length > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>{formData.country}:</strong> {regions.length} regiões carregadas
              </p>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading || !formData.country || regions.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Dados de Estados
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // Right Column - Results
  const rightColumn = result ? (
    <ToolResultCard
      title={`Dados de Estados/Regiões - ${formData.country}`}
      result={result}
    />
  ) : (
    <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <p className="text-muted-foreground text-center">
        Configure as opções à esquerda e clique em "Gerar Dados de Estados" para ver os resultados aqui.
      </p>
    </div>
  );

  return (
    <TwoColumnToolLayout
      title="Segmentador de Estados/Regiões"
      description="Gere listas abrangentes de estados, províncias ou regiões para qualquer país no formato compatível com Google Ads."
      icon={<MapPin className="h-6 w-6 text-primary" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}