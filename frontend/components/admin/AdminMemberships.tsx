import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import backend from '../../client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';

const ADMIN_EMAILS = [
  'guuh2358@gmail.com',
];

export default function AdminMemberships() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    kiwifyOrderId: '',
    purchasedAt: '',
    reason: ''
  });

  // Check if user is admin
  const isAdmin = user?.primaryEmailAddress?.emailAddress &&
    ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar para Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await backend.hub.createMembership({
        email: formData.email,
        kiwifyOrderId: formData.kiwifyOrderId,
        purchasedAt: formData.purchasedAt || undefined,
        reason: formData.reason || undefined
      });

      setSuccess(
        `✅ Membership criada com sucesso!\n\n` +
        `ID: ${response.membership.id}\n` +
        `Email: ${response.membership.email}\n` +
        `Status: ${response.membership.status}\n` +
        `Order ID: ${response.membership.orderId}\n` +
        `Claim Code: ${response.membership.claimCode}`
      );

      // Reset form
      setFormData({
        email: '',
        kiwifyOrderId: '',
        purchasedAt: '',
        reason: ''
      });
    } catch (err: any) {
      console.error('Erro ao criar membership:', err);
      setError(err.message || 'Erro ao criar membership. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin - Criar Membership</h1>
          <p className="text-muted-foreground">
            Use este painel para criar manualmente registros de membership quando webhooks falham.
          </p>
        </div>

        {error && (
          <Card className="mb-6 p-4 bg-red-50 border-red-200">
            <h3 className="font-bold text-red-800 mb-2">Erro</h3>
            <p className="text-red-700 whitespace-pre-wrap">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="mb-6 p-4 bg-green-50 border-green-200">
            <h3 className="font-bold text-green-800 mb-2">Sucesso!</h3>
            <p className="text-green-700 whitespace-pre-wrap font-mono text-sm">{success}</p>
          </Card>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email do Cliente *</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="cliente@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email usado na compra Kiwify
              </p>
            </div>

            <div>
              <Label htmlFor="kiwifyOrderId">Order ID (Kiwify) *</Label>
              <Input
                id="kiwifyOrderId"
                type="text"
                required
                placeholder="q5TWQya"
                value={formData.kiwifyOrderId}
                onChange={(e) => setFormData({ ...formData, kiwifyOrderId: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ID do pedido da Kiwify (será usado como claim code)
              </p>
            </div>

            <div>
              <Label htmlFor="purchasedAt">Data da Compra (opcional)</Label>
              <Input
                id="purchasedAt"
                type="date"
                placeholder="2024-10-20"
                value={formData.purchasedAt}
                onChange={(e) => setFormData({ ...formData, purchasedAt: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe em branco para usar a data atual
              </p>
            </div>

            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                type="text"
                placeholder="Ex: webhook falhou, criação manual"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Será registrado no log de auditoria
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Membership'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">ℹ️ Informações Importantes</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>O status será automaticamente definido como 'active' ou 'waitlisted' baseado na capacidade (limite de 20 ativos)</li>
            <li>O claim code será igual ao Order ID da Kiwify</li>
            <li>Todas as ações são registradas no log de auditoria</li>
            <li>Verifique se não existe já um registro para este email ou Order ID</li>
          </ul>
        </Card>

        <Card className="mt-6 p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-bold text-yellow-800 mb-2">📝 Caso de Uso: brenoadf1@gmail.com</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Email:</strong> brenoadf1@gmail.com</p>
            <p><strong>Order ID:</strong> q5TWQya</p>
            <p><strong>Data da Compra:</strong> 2024-10-20</p>
            <p><strong>Motivo:</strong> Webhook não processado - criação manual</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
