import { Clock, Mail, CheckCircle2 } from "lucide-react";

interface WaitlistScreenProps {
  email?: string;
  position?: number;
}

export default function WaitlistScreen({ email }: WaitlistScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl">
                <Clock className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Você está na lista de espera
              </h1>
              <p className="text-slate-400 text-lg">
                Obrigado por adquirir o MagikTools! 
              </p>
            </div>

            <div className="w-full bg-slate-800/50 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-white font-medium">Pagamento confirmado</p>
                  <p className="text-sm text-slate-400">Sua compra foi aprovada com sucesso</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-white font-medium">Notificação automática</p>
                  <p className="text-sm text-slate-400">
                    Você receberá um email em{" "}
                    <span className="text-white font-medium">{email || "seu email"}</span>{" "}
                    assim que uma vaga for liberada
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-white font-medium">Acesso garantido</p>
                  <p className="text-sm text-slate-400">
                    Todas as compras são processadas por ordem de chegada
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-sm text-slate-500">
                Atualmente estamos com capacidade máxima para garantir a melhor experiência.
                Você será promovido automaticamente quando houver uma vaga disponível.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Dúvidas? Entre em contato com{" "}
            <a href="mailto:suporte@magiktools.com" className="text-amber-400 hover:text-amber-300 transition-colors">
              suporte@magiktools.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
