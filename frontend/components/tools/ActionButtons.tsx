import React from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ActionButtonsProps {
  content: string;
}

export default function ActionButtons({ content }: ActionButtonsProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copiado!",
        description: "Conteúdo copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o conteúdo.",
        variant: "destructive",
      });
    }
  };

  const handleExportTxt = () => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conteudo-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Exportado!",
        description: "Arquivo TXT baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível exportar o arquivo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 px-3 text-muted-foreground hover:text-foreground"
      >
        <Copy className="h-3.5 w-3.5 mr-1.5" />
        Copiar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportTxt}
        className="h-8 px-3 text-muted-foreground hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Exportar TXT
      </Button>
    </div>
  );
}