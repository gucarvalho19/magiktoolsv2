import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../lib/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import UserAvatar from '../auth/UserAvatar';
import Logo from '../Logo';

interface ToolLayoutProps {
  children: React.ReactNode;
}

export default function ToolLayout({ children }: ToolLayoutProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center">
              <Logo height="40px" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <UserAvatar showName={false} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1 min-h-0">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
