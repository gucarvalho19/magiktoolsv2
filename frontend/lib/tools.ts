import { 
  Target, 
  Megaphone, 
  PenTool, 
  Eye, 
  MapPin, 
  Shield, 
  AlertTriangle, 
  RotateCcw, 
  User, 
  Type,
  Cookie,
  Bell
} from 'lucide-react';

export function isNewTool(createdAt?: string): boolean {
  if (!createdAt) return false;
  
  const toolDate = new Date(createdAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return toolDate > sevenDaysAgo;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'ai' | 'utility';
  path: string;
  createdAt?: string;
}

const toolsData: Tool[] = [
  // AI Layer Tools
  {
    id: 'negative-keywords',
    name: 'Planejador de Palavras-chave Negativas',
    description: 'Gere listas abrangentes de palavras-chave negativas para otimizar suas campanhas de anúncios e reduzir gastos desnecessários.',
    icon: Target,
    category: 'ai',
    path: '/tools/negative-keywords',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'ad-builder',
    name: 'Copywriter de Anúncios',
    description: 'Gere textos de vendas persuasivos e conteúdo de marketing que converte visitantes em clientes.',
    icon: Megaphone,
    category: 'ai',
    path: '/tools/ad-builder',
    createdAt: '2024-01-10T09:00:00Z'
  },
  {
    id: 'copy-builder',
    name: 'Copywriter de Review',
    description: 'Crie anúncios atraentes para Google Ads, com geração baseada em IA.',
    icon: PenTool,
    category: 'ai',
    path: '/tools/copy-builder',
    createdAt: '2024-01-12T14:30:00Z'
  },
  {
    id: 'ghost',
    name: 'Ghost',
    description: 'Crie texto mascarado usando caracteres cirílicos, árabes e gregos que contornam filtros de texto.',
    icon: Eye,
    category: 'ai',
    path: '/tools/ghost',
    createdAt: '2024-02-01T16:45:00Z'
  },
  {
    id: 'states-segmenter',
    name: 'Segmentador de Estados/Regiões',
    description: 'Gere listas abrangentes de estados, províncias ou regiões com dados demográficos opcionais.',
    icon: MapPin,
    category: 'ai',
    path: '/tools/states-segmenter',
    createdAt: '2024-01-20T11:15:00Z'
  },
  {
    id: 'hidden-agent',
    name: 'Spy Digistore24',
    description: 'Gere links de afiliado mascarados e ocultos para protegê-los de detecção e aumentar conversões.',
    icon: Shield,
    category: 'ai',
    path: '/tools/hidden-agent',
    createdAt: '2024-01-08T13:20:00Z'
  },
  
  // Utility Layer Tools
  {
    id: 'exit-intent',
    name: 'Popup de Intenção de Saída [Blackhat]',
    description: 'Gere código agressivo de popup de intenção de saída com múltiplos métodos para capturar visitantes que estão saindo.',
    icon: AlertTriangle,
    category: 'utility',
    path: '/tools/exit-intent',
    createdAt: '2024-01-25T15:00:00Z'
  },
  {
    id: 'back-redirect',
    name: 'Redirecionamento de Volta [Blackhat]',
    description: 'Crie código agressivo de redirecionamento do botão voltar que impede usuários de sair da sua página.',
    icon: RotateCcw,
    category: 'utility',
    path: '/tools/back-redirect',
    createdAt: '2024-01-22T12:30:00Z'
  },
  {
    id: 'author-generator',
    name: 'Gerador de Autor com Horário',
    description: 'Gere nomes de autores realistas com timestamps para comentários e elementos de prova social.',
    icon: User,
    category: 'utility',
    path: '/tools/author-generator',
    createdAt: '2024-01-18T08:45:00Z'
  },
  {
    id: 'marquee-generator',
    name: 'Gerador de Letreiro',
    description: 'Crie letreiros de texto rolante modernos baseados em CSS com estilização e animações customizáveis.',
    icon: Type,
    category: 'utility',
    path: '/tools/marquee-generator',
    createdAt: '2024-02-05T17:20:00Z'
  },
  {
    id: 'cookie-marker',
    name: 'Marcador de Cookie na Presell',
    description: 'Gere código JavaScript personalizado para disparar automaticamente seu cookie de afiliado em páginas de presell.',
    icon: Cookie,
    category: 'utility',
    path: '/tools/cookie-marker',
    createdAt: '2025-10-15T10:00:00Z'
  },
  {
    id: 'sales-notification',
    name: 'Notificação de Vendas na Página',
    description: 'Gere popups de notificação de vendas falsas personalizáveis para aumentar prova social em sua página.',
    icon: Bell,
    category: 'utility',
    path: '/tools/sales-notification',
    createdAt: '2025-10-15T11:00:00Z'
  }
];

function sortToolsAlphabetically(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => {
    const nameComparison = a.name.localeCompare(b.name, 'pt-BR', { 
      sensitivity: 'base',
      numeric: true 
    });
    
    if (nameComparison !== 0) {
      return nameComparison;
    }
    
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    
    return 0;
  });
}

export const tools: Tool[] = sortToolsAlphabetically(toolsData);
