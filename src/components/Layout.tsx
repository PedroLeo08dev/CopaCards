import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import StickerForm from './StickerForm';
import {
  Home,
  Library,
  PlusCircle,
  MessageCircle,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'feed' | 'collection' | 'messages' | 'profile';
  onNavigate: (page: 'feed' | 'collection' | 'messages' | 'profile') => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showStickerForm, setShowStickerForm] = useState(false);

  const navigation = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'collection', label: 'Coleção', icon: Library },
    { id: 'messages', label: 'Mensagens', icon: MessageCircle },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Desktop (uses CSS variable-backed card background) */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-primary">⚽ CopaCards</h1>
              <nav className="hidden md:flex gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={currentPage === item.id ? 'default' : 'ghost'}
                      onClick={() => onNavigate(item.id as any)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowStickerForm(true)}
                  className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden md:inline">Nova Figurinha</span>
                </Button>

                {/* Desktop theme toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="hidden md:flex"
                >
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>

                {/* Desktop sign-out */}
                <Button variant="ghost" size="icon" onClick={signOut} className="hidden md:flex">
                  <LogOut className="h-4 w-4" />
                </Button>

                {/* Mobile hamburger menu: theme toggle + sign out */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent sideOffset={8}>
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === 'light' ? (
                        <div className="flex items-center gap-2"><Moon className="h-4 w-4" /> Alternar para escuro</div>
                      ) : (
                        <div className="flex items-center gap-2"><Sun className="h-4 w-4" /> Alternar para claro</div>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <div className="flex items-center gap-2"><LogOut className="h-4 w-4" /> Sair</div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Bottom Navigation - Mobile (uses CSS variable-backed card background) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card shadow-md">
        <nav className="flex justify-around items-center h-16 px-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                  currentPage === item.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <StickerForm
        open={showStickerForm}
        onOpenChange={setShowStickerForm}
        onSuccess={() => {
          setShowStickerForm(false);
          if (currentPage === 'feed') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
