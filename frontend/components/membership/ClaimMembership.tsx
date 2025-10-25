import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import backend from '../../client';

export default function ClaimMembership() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const [searchParams] = useSearchParams();

  const [claimCode, setClaimCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate(`/sign-in?redirect_url=/claim${claimCode ? `?code=${claimCode}` : ''}`);
    }
  }, [isLoaded, isSignedIn, navigate, claimCode]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!claimCode.trim()) {
      setError('Por favor, digite o código de resgate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await backend.hub.claim({ claimCode: claimCode.trim() });

      if (response.success) {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError('Falha ao resgatar o código. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Claim error:', err);

      // Handle specific error messages
      if (err.message?.includes('already has a claimed membership')) {
        setError('Você já possui uma assinatura vinculada à sua conta.');
      } else if (err.message?.includes('invalid or already used')) {
        setError('Código inválido ou já utilizado por outra pessoa.');
      } else if (err.message?.includes('claim code already used')) {
        setError('Este código já foi utilizado.');
      } else {
        setError(err.message || 'Erro ao resgatar código. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
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
          <h1 className="text-2xl font-bold">Código Resgatado!</h1>
          <p className="text-muted-foreground">
            Sua assinatura foi vinculada com sucesso. Redirecionando para o dashboard...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Resgatar Código de Venda</h1>
          <p className="text-sm text-muted-foreground">
            Digite o código que você recebeu após a compra para ativar sua assinatura
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleClaim} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claimCode">ID da Venda</Label>
            <Input
              id="claimCode"
              type="text"
              placeholder="Ex: 2a0NnH5"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value)}
              required
              disabled={loading}
              className="text-center text-lg font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Você encontra o ID da venda no email de confirmação ou na área de membros da Kiwify
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Resgatando...' : 'Resgatar Código'}
          </Button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Help */}
        <div className="pt-4 border-t text-center text-sm">
          <p className="text-muted-foreground">
            Não encontrou seu código?{' '}
            <button
              type="button"
              onClick={() => navigate('/membership/lookup')}
              className="text-primary hover:underline font-medium"
            >
              Buscar minha compra
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
