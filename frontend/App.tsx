import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useAuth, ClerkLoaded, ClerkLoading } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './components/dashboard/Dashboard';
import ToolLayout from './components/tools/ToolLayout';
import Footer from './components/Footer';
import NegativeKeywordsPlanner from './components/tools/NegativeKeywordsPlanner';
import AdBuilder from './components/tools/AdBuilder';
import CopyBuilder from './components/tools/CopyBuilder';
import Ghost from './components/tools/Ghost';
import StatesSegmenter from './components/tools/StatesSegmenter';
import HiddenAgent from './components/tools/HiddenAgent';
import ExitIntentPopup from './components/tools/ExitIntentPopup';
import BackRedirect from './components/tools/BackRedirect';
import AuthorGenerator from './components/tools/AuthorGenerator';
import MarqueeGenerator from './components/tools/MarqueeGenerator';
import CookieMarker from './components/tools/CookieMarker';
import SalesNotification from './components/tools/SalesNotification';
import MembershipGate from './components/membership/MembershipGate';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { config } from './config';

const DISABLE_AUTH = config.disableAuth;
const PUBLISHABLE_KEY = config.clerk.publishableKey;
const FRONTEND_API = config.clerk.frontendApi;

console.log('🚀 NEW BUILD DEPLOYED - timestamp:', Date.now());

function ProtectedRoute({ children }: { children: any }) {
  if (DISABLE_AUTH) return <>{children}</>;
  return (
    <>
      <SignedIn>
        <MembershipGate>{children}</MembershipGate>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function AppContent() {
  const auth = DISABLE_AUTH ? { isSignedIn: true } : useAuth();
  const { isSignedIn } = auth;

  useEffect(() => {
    document.title = 'MagikTools';
    
    const setFavicon = () => {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = '/assets/logo/favicon.png';
      document.getElementsByTagName('head')[0].appendChild(link);
    };
    
    setFavicon();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/negative-keywords"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <NegativeKeywordsPlanner />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/ad-builder"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <AdBuilder />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/copy-builder"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <CopyBuilder />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/ghost"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <Ghost />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/states-segmenter"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <StatesSegmenter />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/hidden-agent"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <HiddenAgent />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/exit-intent"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <ExitIntentPopup />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/back-redirect"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <BackRedirect />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/author-generator"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <AuthorGenerator />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/marquee-generator"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <MarqueeGenerator />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/cookie-marker"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <CookieMarker />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools/sales-notification"
            element={
              <ProtectedRoute>
                <ToolLayout>
                  <SalesNotification />
                </ToolLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
      {isSignedIn && <Footer />}
      {DISABLE_AUTH && (
        <div className="fixed bottom-2 right-2 text-xs px-2 py-1 rounded bg-yellow-200/80 text-black font-medium shadow-md">
          DEV MODE: auth desativada
        </div>
      )}
    </div>
  );
}

function AppWithAuth() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      {...(FRONTEND_API ? { frontendApi: FRONTEND_API } : {})}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <ClerkLoaded>
        <AppContent />
      </ClerkLoaded>
      <ClerkLoading>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-foreground">Carregando…</div>
        </div>
      </ClerkLoading>
    </ClerkProvider>
  );
}

export default function App() {
  if (DISABLE_AUTH) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="magiktools-theme">
        <Router>
          <Routes>
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-de-uso" element={<TermsOfService />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </Router>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="magiktools-theme">
      <Router>
        <Routes>
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos-de-uso" element={<TermsOfService />} />
          <Route path="/*" element={<AppWithAuth />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
