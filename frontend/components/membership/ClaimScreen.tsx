import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useBackend } from '../../lib/useBackend';

const CLAIM_CODE_STORAGE_KEY = 'pending_claim_code';

export default function ClaimScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const backend = useBackend();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-code'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const claimCodeFromUrl = searchParams.get('code');

  useEffect(() => {
    const processClaim = async () => {
      console.log('🎫 ClaimScreen useEffect triggered', { claimCodeFromUrl, isLoaded, isSignedIn });

      // Get claim code from URL or localStorage
      let claimCode = claimCodeFromUrl;

      if (!claimCode) {
        // Try to get from localStorage (in case Clerk redirected after signup)
        const storedCode = localStorage.getItem(CLAIM_CODE_STORAGE_KEY);
        if (storedCode) {
          console.log('📦 Found claim code in localStorage:', storedCode);
          claimCode = storedCode;
        }
      }

      if (!claimCode) {
        console.log('❌ No claim code provided (URL or localStorage)');
        setStatus('no-code');
        return;
      }

      // If not authenticated, save code to localStorage and wait
      if (!isLoaded || !isSignedIn) {
        console.log('⏳ Not authenticated yet, saving code to localStorage...');
        localStorage.setItem(CLAIM_CODE_STORAGE_KEY, claimCode);
        return;
      }

      console.log('🎫 Processing claim with code:', claimCode);

      try {
        setStatus('loading');
        console.log('📡 Calling backend.hub.claim...');

        const data = await backend.hub.claim({ claimCode });

        console.log('✅ Claim successful:', data);

        // Clear localStorage on success
        localStorage.removeItem(CLAIM_CODE_STORAGE_KEY);

        setStatus('success');

        setTimeout(() => {
          console.log('🔄 Redirecting to dashboard...');
          navigate('/dashboard');
        }, 2000);
      } catch (err: any) {
        console.error('❌ Claim failed:', err);

        // Clear localStorage on error too
        localStorage.removeItem(CLAIM_CODE_STORAGE_KEY);

        setErrorMessage(err.message || 'Erro ao resgatar código. Tente novamente.');
        setStatus('error');
      }
    };

    processClaim();
  }, [claimCodeFromUrl, isLoaded, isSignedIn, navigate, backend]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 space-y-6 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Resgatando seu acesso...</h1>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto vinculamos sua compra à sua conta.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Acesso Ativado!</h1>
            <p className="text-muted-foreground">
              Sua compra foi vinculada com sucesso. Redirecionando para o dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // No code provided
  if (status === 'no-code') {
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Código não informado</h1>
            <p className="text-muted-foreground">
              Você precisa fornecer um código válido para resgatar seu acesso.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/membership/lookup')}
              className="w-full"
            >
              Buscar Minha Compra
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Voltar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
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
          <h1 className="text-2xl font-bold">Erro ao Resgatar</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
          <div className="text-sm text-muted-foreground pt-2">
            <p className="font-medium mb-1">Possíveis causas:</p>
            <ul className="list-disc list-inside text-left space-y-1">
              <li>Código já foi utilizado</li>
              <li>Código inválido ou expirado</li>
              <li>Você já possui um acesso vinculado</li>
            </ul>
          </div>
        </div>
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/membership/lookup')}
            className="w-full"
          >
            Buscar Novamente
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </div>
      </Card>
    </div>
  );
}
