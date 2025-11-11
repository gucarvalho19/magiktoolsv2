import React, { useState, useEffect } from 'react';
import { useUser } from '../../lib/useAuth';
import { UserButton } from '@clerk/clerk-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Brain, Wrench, Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tools, isNewTool } from '../../lib/tools';
import Logo from '../Logo';

function HeroBannerLogo() {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' 
    ? '/assets/logo/logo-colorida.png' 
    : '/assets/logo/logo-colorida-preto.png';
  
  return (
    <img
      src={logoSrc}
      alt="Magik Tools"
      loading="lazy"
      style={{
        height: "70px",
        objectFit: "contain",
        display: "block",
        margin: "0 auto 12px"
      }}
      className="relative z-10"
    />
  );
}

type FilterCategory = 'all' | 'favorites' | 'ai' | 'utility';

export default function Dashboard() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('dashboard-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (toolId: string) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = (() => {
      switch (activeFilter) {
        case 'favorites':
          return favorites.includes(tool.id);
        case 'ai':
          return tool.category === 'ai';
        case 'utility':
          return tool.category === 'utility';
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesFilter;
  });

  const aiTools = filteredTools.filter(tool => tool.category === 'ai');
  const utilityTools = filteredTools.filter(tool => tool.category === 'utility');
  const favoriteTools = filteredTools.filter(tool => favorites.includes(tool.id));
  
  const filterButtons = [
    { id: 'all' as const, label: 'Todas', icon: Star, count: tools.length },
    { id: 'favorites' as const, label: 'Favoritas', icon: Star, count: favorites.length },
    { id: 'ai' as const, label: 'Ferramentas de IA', icon: Brain, count: tools.filter(t => t.category === 'ai').length },
    { id: 'utility' as const, label: 'Utilitários', icon: Wrench, count: tools.filter(t => t.category === 'utility').length }
  ];
  
  const ToolCard = ({ tool }: { tool: typeof tools[0] }) => {
    const isFavorite = favorites.includes(tool.id);
    const isNew = isNewTool(tool.createdAt);
    
    const handleCardClick = () => {
      navigate(tool.path);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(tool.path);
      }
    };
    
    return (
      <Card 
        className={`hover:shadow-xl transition-all duration-200 cursor-pointer group relative border-2 hover:border-primary/20 ${
          isFavorite ? 'ring-2 ring-yellow-400 shadow-lg' : ''
        }`}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        aria-label={`Abrir ferramenta ${tool.name}`}
      >
        {isNew && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10 shadow-md">
            Novo
          </div>
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <tool.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{tool.name}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(tool.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Star className={`h-4 w-4 ${
                isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              }`} />
            </Button>
          </div>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={handleCardClick}
          >
            Abrir Ferramenta
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Logo height="40px" />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Banner Hero Section */}
      <div className="relative overflow-hidden mb-12 sm:mb-14 md:mb-16">
        {/* Modern Gradient Background - Light Mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#e6e6e6] via-[#f79a6b]/20 to-[#e7a437]/30 dark:hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-[#f1580c]/20 to-transparent blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-[#ed2716]/15 to-transparent blur-2xl"></div>
        </div>
        
        {/* Modern Gradient Background - Dark Mode */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-br from-[#02174c] via-[#02174c] to-[#1a1a2e]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#02174c] via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-[#ed2716]/25 via-[#f1580c]/15 to-transparent blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-[#e7a437]/20 to-transparent blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-[#f79a6b]/10 to-transparent blur-2xl"></div>
        </div>
        
        {/* Main Content */}
        <main className="relative container mx-auto px-4 py-6 md:py-8 flex-1 min-h-0">
          <div className="space-y-6 md:space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-4 md:py-6">
              <HeroBannerLogo />
              <p className="relative z-10 text-[#555555] dark:text-[#d4d4d4] text-lg font-normal text-center leading-relaxed max-w-[680px] mx-auto my-4 px-4">
                Acesse ferramentas poderosas com IA e utilitários para aumentar sua produtividade e otimizar seu fluxo de trabalho.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-md mx-auto relative z-10 px-4">
                <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar ferramentas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/90 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200 shadow-sm"
                />
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 relative z-10 pb-4 px-2">
                {filterButtons.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  return (
                    <Button
                      key={filter.id}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-1 sm:gap-2 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 shadow-sm ${
                        isActive 
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary shadow-md' 
                          : 'bg-background/90 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground border-border/50'
                      }`}
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline font-medium">{filter.label}</span>
                      <span className="sm:hidden font-medium">{filter.label.split(' ')[0]}</span>
                      <span className={`px-1 sm:px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        isActive 
                          ? 'bg-primary-foreground/20 text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {filter.count}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Tools Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="space-y-8">
          {/* Tools Sections */}
        {activeFilter === 'all' && (
          <>
            {/* Favorites Section - only show if there are favorites */}
            {favoriteTools.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-xl font-semibold text-foreground">Favoritas</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            )}
            
            {/* AI Tools Section */}
            {aiTools.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Ferramentas de IA</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            )}

            {/* Utility Tools Section */}
            {utilityTools.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Utilitários</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {utilityTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        
        {/* Single Category View */}
        {activeFilter !== 'all' && (
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              {activeFilter === 'favorites' && <Star className="h-5 w-5 text-yellow-500" />}
              {activeFilter === 'ai' && <Brain className="h-5 w-5 text-primary" />}
              {activeFilter === 'utility' && <Wrench className="h-5 w-5 text-primary" />}
              <h3 className="text-xl font-semibold text-foreground">
                {filterButtons.find(f => f.id === activeFilter)?.label}
              </h3>
            </div>
            
            {filteredTools.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  {searchTerm ? (
                    <p>Nenhuma ferramenta encontrada para "{searchTerm}"</p>
                  ) : (
                    <p>Nenhuma ferramenta nesta categoria ainda.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </section>
        )}
        
          {/* No results message for 'all' view */}
          {activeFilter === 'all' && filteredTools.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <p>Nenhuma ferramenta encontrada para "{searchTerm}"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
