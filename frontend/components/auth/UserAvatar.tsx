import React, { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '../../lib/useAuth';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserAvatarProps {
  showName?: boolean;
  className?: string;
}

export default function UserAvatar({ showName = true, className = "" }: UserAvatarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 touch-manipulation"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        {/* Avatar Circle */}
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm border border-primary/20 overflow-hidden">
          {user?.imageUrl ? (
            <img 
              src={user.imageUrl} 
              alt={user.fullName || user.primaryEmailAddress?.emailAddress || 'User'}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const nextElement = target.nextElementSibling as HTMLElement;
                if (nextElement) nextElement.style.display = 'flex';
              }}
            />
          ) : null}
          <span className={user?.imageUrl ? "hidden" : "flex"}>
            {getInitials(user?.fullName)}
          </span>
        </div>
        
        {/* User Name (hidden on mobile if showName is false) */}
        {showName && (
          <span className="text-sm text-foreground hidden sm:block max-w-32 truncate">
            {user?.fullName || user?.primaryEmailAddress?.emailAddress}
          </span>
        )}
        
        {/* Dropdown Arrow */}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
          isMenuOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Mobile Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden" />
          
          {/* Menu */}
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-card border border-border rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200
                      max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-4 max-sm:right-4 max-sm:mt-0 max-sm:mb-4 max-sm:w-auto max-sm:rounded-t-xl"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium border border-primary/20 overflow-hidden">
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={user.fullName || user.primaryEmailAddress?.emailAddress || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const nextElement = target.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span className={user?.imageUrl ? "hidden" : "flex"}>
                    {getInitials(user?.fullName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => handleMenuItemClick(() => {
                  // TODO: Navigate to profile page when implemented
                  console.log('Navigate to profile');
                })}
                className="w-full flex items-center px-4 py-3 sm:py-2 text-sm text-foreground hover:bg-muted/50 transition-colors touch-manipulation"
              >
                <User className="h-4 w-4 mr-3 text-muted-foreground" />
                Perfil
              </button>
              
              <button
                onClick={() => handleMenuItemClick(() => {
                  // TODO: Navigate to settings page when implemented
                  console.log('Navigate to settings');
                })}
                className="w-full flex items-center px-4 py-3 sm:py-2 text-sm text-foreground hover:bg-muted/50 transition-colors touch-manipulation"
              >
                <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
                Configurações
              </button>
              
              <hr className="my-2 border-border" />
              
              <button
                onClick={() => handleMenuItemClick(() => signOut())}
                className="w-full flex items-center px-4 py-3 sm:py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors touch-manipulation"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}