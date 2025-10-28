import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import backend from '../../client';

type SearchMethod = 'email' | 'orderId';

interface MembershipResult {
  id: number;
  email: string;
  status: string;
  purchasedAt: string;
  isClaimed: boolean;
  claimCode?: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  waitlisted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  past_due: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  canceled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  refunded: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  waitlisted: 'Lista de Espera',
  pending: 'Pendente',
  past_due: 'Pagamento Atrasado',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
};

export default function MembershipLookup() {
  const navigate = useNavigate();
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('email');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MembershipResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchValue.trim()) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError(null);

    try {
      const params = searchMethod === 'email'
        ? { email: searchValue.trim() }
        : { orderId: searchValue.trim() };

      const data = await backend.hub.findMembership(params);

      if (data.found && data.membership) {
        setResult(data.membership);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar compra. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyClaimCode = async () => {
    if (result?.claimCode) {
      try {
        await navigator.clipboard.writeText(result.claimCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Encontrar Minha Compra</h1>
          <p className="text-sm text-muted-foreground">
            Recupere seu ID da Venda ou verifique o status da sua compra
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Method Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setSearchMethod('email')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                searchMethod === 'email'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              }`}
            >
              Buscar por E-mail
            </button>
            <button
              type="button"
              onClick={() => setSearchMethod('orderId')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                searchMethod === 'orderId'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              }`}
            >
              Buscar por ID do Pedido
            </button>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="search">
              {searchMethod === 'email' ? 'E-mail usado na compra' : 'ID do Pedido'}
            </Label>
            <Input
              id="search"
              type={searchMethod === 'email' ? 'email' : 'text'}
              placeholder={
                searchMethod === 'email'
                  ? 'seu@email.com'
                  : 'Ex: q5TWQya'
              }
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar Compra'}
          </Button>
        </form>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">✓ Compra encontrada!</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusColors[result.status]
                }`}
              >
                {statusLabels[result.status]}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">E-mail: </span>
                <span className="font-medium">{result.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Data da compra: </span>
                <span className="font-medium">{formatDate(result.purchasedAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  statusColors[result.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {statusLabels[result.status] || result.status}
                </span>
              </div>

              {result.isClaimed ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Esta compra já foi vinculada a uma conta
                  </p>
                </div>
              ) : result.claimCode ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Seu ID da Venda:</Label>
                    <div className="mt-2 flex gap-2">
                      <div className="flex-1 bg-muted border rounded-lg p-3 text-center">
                        <code className="text-lg font-mono font-bold">
                          {result.claimCode}
                        </code>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyClaimCode}
                        className="px-4"
                      >
                        {copied ? '✓' : 'Copiar'}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => navigate(`/`)}
                    className="w-full"
                  >
                    Ativar Acesso →
                  </Button>

                  {result.status === 'waitlisted' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 dark:text-yellow-200">
                        <strong>Lista de Espera:</strong> Você receberá um e-mail assim que
                        uma vaga for liberada.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Not Found */}
        {notFound && (
          <div className="space-y-3 pt-4 border-t">
            <h2 className="text-lg font-semibold text-destructive">
              Nenhuma compra encontrada
            </h2>
            <p className="text-sm text-muted-foreground">
              Não encontramos nenhum pedido com {searchMethod === 'email' ? 'este e-mail' : 'este ID'}.
            </p>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p className="font-medium">Sugestões:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Verifique se digitou corretamente</li>
                <li>
                  Tente buscar pelo{' '}
                  {searchMethod === 'email' ? 'ID do pedido' : 'e-mail'}
                </li>
                <li>Entre em contato com o suporte</li>
              </ul>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Help */}
        <div className="pt-4 border-t text-center text-sm text-muted-foreground">
          <p>
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-primary hover:underline font-medium"
            >
              Fazer login
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
