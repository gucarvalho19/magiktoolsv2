import { useState } from 'react';
import { Check, Copy, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ThemeProvider } from '@/contexts/ThemeContext';
import backend from '~backend/client';

type SearchMethod = 'orderId' | 'email';

interface MembershipInfo {
  id: number;
  email: string;
  status: string;
  purchasedAt: string;
  isClaimed: boolean;
  claimCode?: string;
}

export default function MembershipLookup() {
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('orderId');
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ found: boolean; membership?: MembershipInfo } | null>(null);
  const [copied, setCopied] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSearch = async () => {
    setError('');
    setResult(null);
    setCopied(false);

    if (searchMethod === 'orderId' && !orderId.trim()) {
      setError('Por favor, insira o ID do pedido Kiwify');
      return;
    }

    if (searchMethod === 'email') {
      if (!email.trim()) {
        setError('Por favor, insira seu e-mail');
        return;
      }
      if (!validateEmail(email.trim())) {
        setError('Por favor, insira um e-mail válido');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await backend.hub.findMembership({
        orderId: searchMethod === 'orderId' ? orderId.trim() : undefined,
        email: searchMethod === 'email' ? email.trim() : undefined,
      });

      setResult(response);
    } catch (err: any) {
      console.error('Error finding membership:', err);
      setError(err.message || 'Erro ao buscar membership. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyClaimCode = async () => {
    if (result?.membership?.claimCode) {
      await navigator.clipboard.writeText(result.membership.claimCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      waitlisted: { label: 'Lista de Espera', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      pending: { label: 'Pendente', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      past_due: { label: 'Vencido', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
      canceled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      refunded: { label: 'Reembolsado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="magiktools-theme">
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mb-6">
            <img
              src="/assets/logo/logo-colorida-preto.png"
              alt="MagikTools"
              className="mx-auto"
              style={{ height: '40px', objectFit: 'contain' }}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Encontre sua Compra</h1>
          <p className="text-muted-foreground text-sm">
            Localize seu pedido e recupere seu código de acesso
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Buscar por:</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSearchMethod('orderId')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    searchMethod === 'orderId'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  ID do Pedido
                </button>
                <button
                  onClick={() => setSearchMethod('email')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    searchMethod === 'email'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  E-mail
                </button>
              </div>
            </div>

            {searchMethod === 'orderId' ? (
              <div className="space-y-2">
                <Label htmlFor="orderId" className="text-sm">ID do Pedido Kiwify</Label>
                <Input
                  id="orderId"
                  placeholder="KIW-XXX..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: KIW-XXXXXXXXX
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">E-mail da Compra</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Use o e-mail cadastrado na compra
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full h-11"
            >
              {loading ? (
                'Buscando...'
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Membership
                </>
              )}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6 space-y-4">
            {result.found && result.membership ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Membership Encontrada</h3>
                    <p className="text-sm text-muted-foreground">{result.membership.email}</p>
                  </div>
                  {getStatusBadge(result.membership.status)}
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Data da Compra</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(result.membership.purchasedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status do Código</p>
                    <p className="text-sm font-medium text-foreground">
                      {result.membership.isClaimed ? (
                        <span className="text-orange-600 dark:text-orange-400">
                          Este membership já foi reivindicado
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">
                          Código disponível para uso
                        </span>
                      )}
                    </p>
                  </div>

                  {!result.membership.isClaimed && result.membership.claimCode && (
                    <>
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2">Seu Código de Acesso</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                            <code className="text-lg font-mono font-bold text-primary tracking-wider">
                              {result.membership.claimCode}
                            </code>
                          </div>
                          <Button
                            onClick={copyClaimCode}
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 flex-shrink-0"
                          >
                            {copied ? (
                              <Check className="h-5 w-5 text-green-600" />
                            ) : (
                              <Copy className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <a href="/dashboard" className="block">
                          <Button className="w-full h-11" variant="default">
                            Ir para Tela de Reivindicação →
                          </Button>
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Nenhuma compra encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Não encontramos nenhum pedido com {searchMethod === 'orderId' ? 'este ID' : 'este e-mail'}.
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Sugestões:</p>
                  <ul className="list-disc list-inside text-left inline-block">
                    <li>Verifique se digitou corretamente</li>
                    <li>Tente buscar pelo {searchMethod === 'orderId' ? 'e-mail' : 'ID do pedido'}</li>
                    <li>Entre em contato com o suporte</li>
                  </ul>
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Precisa de ajuda? Entre em contato com o{' '}
            <a href="mailto:suporte@magiktools.com" className="text-primary hover:underline">
              suporte
            </a>
          </p>
        </div>
      </div>
    </div>
    </ThemeProvider>
  );
}
