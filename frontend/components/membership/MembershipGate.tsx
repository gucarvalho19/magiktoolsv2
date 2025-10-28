import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useBackend } from '../../lib/useBackend';

interface MembershipGateProps {
  children: React.ReactNode;
}

// Lista de emails de administradores que sempre têm acesso
const ADMIN_EMAILS = [
  'guuh2358@gmail.com',
  // Adicione outros emails de admin aqui
];

export default function MembershipGate({ children }: MembershipGateProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const navigate = useNavigate();
  const backend = useBackend();
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    console.log('🔄 MembershipGate useEffect', { isLoaded, isSignedIn, userLoaded, hasUser: !!user });

    if (!isLoaded || !isSignedIn) {
      console.log('❌ Not loaded or not signed in');
      setLoading(false);
      return;
    }

    // Aguardar dados do usuário serem carregados
    if (!userLoaded || !user) {
      console.log('⏳ User not loaded yet, keeping loading state');
      setLoading(true); // Explicitamente manter loading
      return;
    }

    // Aguardar email do usuário ser carregado (pode levar mais tempo que user object)
    if (!user.primaryEmailAddress?.emailAddress) {
      console.log('⏳ User email not loaded yet, keeping loading state');
      setLoading(true);
      return;
    }

    console.log('✅ User loaded, checking membership...');

    // Verificar se é administrador
    const userEmail = user.primaryEmailAddress.emailAddress.toLowerCase();
    console.log('📧 User email:', userEmail);

    if (userEmail && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) {
      // Admin sempre tem acesso
      console.log('👑 User is ADMIN - granting access');
      setMembershipStatus('admin');
      setHasChecked(true);
      setLoading(false);
      return;
    }

    const checkMembership = async (attempt = 0) => {
      let shouldStopLoading = true;
      try {
        console.log('🔍 Checking membership via API... (attempt ' + (attempt + 1) + ')');

        // Get Clerk token
        const token = await user.getIdToken();
        console.log('🔑 Got Clerk token:', token ? 'YES' : 'NO');

        // Use fetch directly with Clerk token
        const response = await fetch('/me/membership', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        console.log('📡 Response status:', response.status, response.ok);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Full API response:', data);
        console.log('✅ Membership status:', data.membership?.status);

        setMembershipStatus(data.membership?.status || null);
        setHasChecked(true);
      } catch (err: any) {
        console.error('❌ Error checking membership:', err);

        // Se for 401 e ainda não tentamos 3 vezes, retry
        if ((err.message?.includes('401') || err.message?.includes('HTTP 401')) && attempt < 3) {
          console.log(`🔄 Got 401, token may not be ready yet. Retrying in ${attempt + 1} second(s)... (${attempt + 1}/3)`);
          shouldStopLoading = false; // Manter loading screen durante retry
          setTimeout(() => {
            checkMembership(attempt + 1); // Retry com contador incrementado
          }, (attempt + 1) * 1000); // Exponential backoff: 1s, 2s, 3s
          return; // Não seta hasChecked, mantém loading
        }

        // Depois de 3 tentativas ou outros erros: user realmente não tem membership
        console.log('❌ Max retries reached or non-401 error. Treating as no membership.');
        setMembershipStatus(null);
        setHasChecked(true);
      } finally {
        if (shouldStopLoading) {
          setLoading(false);
        }
      }
    };

    checkMembership(0);
  }, [isLoaded, isSignedIn, userLoaded, user]);

  console.log('🎨 Rendering MembershipGate', { loading, isLoaded, userLoaded, hasChecked, membershipStatus });

  // Loading state
  if (loading || !isLoaded || !userLoaded) {
    console.log('⌛ Showing loading screen');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Not signed in - should be redirected by Clerk
  if (!isSignedIn) {
    return null;
  }

  // No membership - show claim page
  if (hasChecked && !membershipStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Acesso Restrito</h1>
            <p className="text-muted-foreground">
              Você precisa vincular sua compra para acessar o MagikTools Hub.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/membership/lookup')}
              className="w-full"
            >
              Buscar Minha Compra →
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ainda não comprou?{' '}
            <a
              href="https://pay.kiwify.com.br/ioCV7NE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Adquirir acesso
            </a>
          </p>
        </Card>
      </div>
    );
  }

  // Waitlisted - show waitlist message
  if (membershipStatus === 'waitlisted') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Na Lista de Espera</h1>
            <p className="text-muted-foreground">
              Sua compra foi confirmada! Você está na lista de espera para acesso ao Hub.
            </p>
            <p className="text-sm text-muted-foreground">
              Enviaremos um e-mail assim que uma vaga for liberada (limite de 20 usuários ativos).
            </p>
          </div>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  // Inactive statuses (block everything except active, waitlisted, and admin)
  if (membershipStatus && !['active', 'waitlisted', 'admin'].includes(membershipStatus)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Assinatura Inativa</h1>
            <p className="text-muted-foreground">
              Sua assinatura está com status: <strong>{membershipStatus}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o suporte para regularizar sua situação.
            </p>
          </div>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full"
          >
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  // Active membership or admin - allow access
  return <>{children}</>;
}
