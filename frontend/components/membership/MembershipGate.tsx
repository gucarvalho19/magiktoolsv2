import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import backend from '../../client';

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
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    // Verificar se é administrador
    const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    console.log('🔍 DEBUG MembershipGate - User email:', userEmail);
    console.log('🔍 DEBUG MembershipGate - Admin emails:', ADMIN_EMAILS);
    console.log('🔍 DEBUG MembershipGate - Is admin?:', userEmail && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail));

    if (userEmail && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) {
      // Admin sempre tem acesso
      console.log('✅ User is ADMIN - bypassing membership check');
      setMembershipStatus('admin');
      setHasChecked(true);
      setLoading(false);
      return;
    }

    console.log('ℹ️ Not admin, checking membership...');
    const checkMembership = async () => {
      try {
        const response = await backend.hub.getMembership();
        setMembershipStatus(response.status);
        setHasChecked(true);
      } catch (err: any) {
        console.error('Error checking membership:', err);
        // User doesn't have membership
        setMembershipStatus(null);
        setHasChecked(true);
      } finally {
        setLoading(false);
      }
    };

    checkMembership();
  }, [isLoaded, isSignedIn, user]);

  // Loading state
  if (loading || !isLoaded) {
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
              Você precisa resgatar um código de venda para acessar o MagikTools Hub.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/claim')}
              className="w-full"
            >
              Resgatar Código →
            </Button>
            <Button
              onClick={() => navigate('/membership/lookup')}
              variant="outline"
              className="w-full"
            >
              Buscar Minha Compra
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

