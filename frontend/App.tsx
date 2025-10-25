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
import MembershipLookup from './components/membership/MembershipLookup';
import ClaimMembership from './components/membership/ClaimMembership';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { config } from './config';

const DISABLE_AUTH = config.disableAuth;
const PUBLISHABLE_KEY = config.clerk.publishableKey;
const FRONTEND_API = config.clerk.frontendApi;
const CONFIG_ERROR = config.configError;

console.log('🚀 NEW BUILD DEPLOYED - timestamp:', Date.now());

// Localização em Português do Brasil para Clerk
const clerkLocalization = {
  locale: 'pt-BR',
  socialButtonsBlockButton: 'Continuar com {{provider|titleize}}',
  dividerText: 'ou',
  formFieldLabel__emailAddress: 'Endereço de e-mail',
  formFieldLabel__emailAddresses: 'Endereços de e-mail',
  formFieldLabel__password: 'Senha',
  formFieldLabel__newPassword: 'Nova senha',
  formFieldLabel__confirmPassword: 'Confirmar senha',
  formFieldLabel__firstName: 'Nome',
  formFieldLabel__lastName: 'Sobrenome',
  formFieldLabel__username: 'Nome de usuário',
  formFieldInputPlaceholder__emailAddress: 'exemplo@email.com',
  formFieldInputPlaceholder__firstName: 'João',
  formFieldInputPlaceholder__lastName: 'Silva',
  formFieldInputPlaceholder__username: 'joaosilva',
  formFieldError__notMatchingPasswords: 'As senhas não coincidem.',
  formFieldError__matchingPasswords: 'As senhas coincidem.',
  signIn: {
    start: {
      title: 'Entrar',
      subtitle: 'para continuar no {{applicationName}}',
      actionText: 'Não tem uma conta?',
      actionLink: 'Criar conta',
    },
    password: {
      title: 'Digite sua senha',
      actionLink: 'Usar outro método',
    },
    forgotPasswordLink: 'Esqueceu a senha?',
    alternativeMethods: {
      title: 'Use outro método',
      actionLink: 'Ver todas as opções',
      blockButton__emailCode: 'Enviar código para {{identifier}}',
      blockButton__emailLink: 'Enviar link para {{identifier}}',
      blockButton__password: 'Entrar com sua senha',
    },
  },
  signUp: {
    start: {
      title: 'Criar sua conta',
      subtitle: 'para continuar no {{applicationName}}',
      actionText: 'Já tem uma conta?',
      actionLink: 'Entrar',
    },
    continue: {
      title: 'Preencha os campos faltantes',
      subtitle: 'para continuar no {{applicationName}}',
      actionText: 'Já tem uma conta?',
      actionLink: 'Entrar',
    },
  },
  formButtonPrimary: 'Continuar',
  formButtonPrimary__verify: 'Verificar',
  footerActionLink__useAnotherMethod: 'Usar outro método',
  backButton: 'Voltar',
  badge__primary: 'Principal',
  badge__unverified: 'Não verificado',
  badge__userDevice: 'Dispositivo do usuário',
  badge__you: 'Você',
  userProfile: {
    navbar: {
      title: 'Perfil',
      description: 'Gerencie as informações da sua conta',
      account: 'Conta',
      security: 'Segurança',
    },
  },
};

// Componente de erro de configuração
function ConfigErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
          Erro de Configuração
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded p-4 mb-4">
          <pre className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono">
            {error}
          </pre>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p className="mb-2">
            <strong>Para corrigir este problema:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Verifique as variáveis de ambiente no painel de deployment</li>
            <li>Configure as chaves do Clerk corretamente</li>
            <li>Faça um novo deployment após configurar as variáveis</li>
          </ol>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Ambiente: {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

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
      localization={clerkLocalization}
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
  // Se houver erro de configuração, mostrar tela de erro
  if (CONFIG_ERROR) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="magiktools-theme">
        <ConfigErrorScreen error={CONFIG_ERROR} />
      </ThemeProvider>
    );
  }

  if (DISABLE_AUTH) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="magiktools-theme">
        <Router>
          <Routes>
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-de-uso" element={<TermsOfService />} />
            <Route path="/membership/lookup" element={<MembershipLookup />} />
            <Route path="/claim" element={<ClaimMembership />} />
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
          <Route path="/membership/lookup" element={<MembershipLookup />} />
          <Route path="/claim" element={<ClaimMembership />} />
          <Route path="/*" element={<AppWithAuth />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
