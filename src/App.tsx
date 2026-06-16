import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Layout from '@/components/Layout';
import AuthPage from '@/pages/AuthPage';
import FeedPage from '@/pages/FeedPage';
import CollectionPage from '@/pages/CollectionPage';
import MessagesPage from '@/pages/MessagesPage';
import ProfilePage from '@/pages/ProfilePage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<
    'feed' | 'collection' | 'messages' | 'profile'
  >('feed');

  // Listen for global navigation events (from components wanting to open messages/chat)
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent;
      const detail = ev?.detail;
      if (detail?.page) {
        setCurrentPage(detail.page);
        // allow navigation to a specific user's profile
        if (detail.userId) {
          // store target user id on window for ProfilePage to pick up
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.__viewUserId = detail.userId;
        } else {
          // clear any previously set target
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete window.__viewUserId;
        }
      }
    };
    window.addEventListener('app:navigate', handler as EventListener);
    return () => window.removeEventListener('app:navigate', handler as EventListener);
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'feed':
        return <FeedPage />;
      case 'collection':
        return <CollectionPage />;
      case 'messages':
        return <MessagesPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <FeedPage />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={(p: any) => {
        // when user navigates using the layout, clear any targeted view id
        // @ts-ignore
        if (window && (window as any).__viewUserId) delete (window as any).__viewUserId;
        setCurrentPage(p);
      }}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
