import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Política de Privacidade — MagikTools';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Saiba como o MagikTools coleta, utiliza e protege seus dados.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Saiba como o MagikTools coleta, utiliza e protege seus dados.';
      document.head.appendChild(meta);
    }

    const linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) {
      linkCanonical.setAttribute('href', 'https://app.magik.tools/politica-de-privacidade');
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = 'https://app.magik.tools/politica-de-privacidade';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-900">MagikTools</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🧾 Política de Privacidade — MagikTools</h1>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. Introdução</h2>
            <p className="text-gray-700 leading-relaxed">
              Bem-vindo(a) ao MagikTools.<br />
              Esta Política de Privacidade explica como coletamos, utilizamos e protegemos as informações pessoais dos usuários que acessam o aplicativo disponível em <a href="https://app.magik.tools" className="text-blue-600 hover:underline">https://app.magik.tools</a>
            </p>
            <p className="text-gray-700 leading-relaxed">
              Ao utilizar o MagikTools, você concorda com as práticas descritas nesta política.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. Dados coletados</h2>
            <p className="text-gray-700 leading-relaxed">
              O MagikTools coleta apenas as informações necessárias para autenticação, uso das ferramentas internas e melhoria contínua da plataforma.<br />
              Os principais tipos de dados coletados são:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li><strong>Informações de conta:</strong> nome, e-mail e foto de perfil (quando disponíveis), fornecidos voluntariamente no login via Clerk (autenticação com e-mail/senha ou conta Google).</li>
              <li><strong>Dados de pagamento:</strong> processados de forma segura pela Kiwify, plataforma responsável pelas transações e assinaturas (não armazenamos dados de cartão de crédito).</li>
              <li><strong>Informações de uso:</strong> dados técnicos do navegador, data/hora de acesso e interações dentro do app, utilizados para métricas internas e segurança.</li>
              <li><strong>Dados de conteúdo:</strong> textos inseridos nas ferramentas, processados apenas durante o uso, podendo ser analisados por modelos de IA da OpenAI para geração de respostas.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. Finalidade do uso dos dados</h2>
            <p className="text-gray-700 leading-relaxed">Os dados coletados são utilizados para:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li>Autenticar e manter sessões de usuário (via Clerk);</li>
              <li>Fornecer acesso às ferramentas e recursos contratados;</li>
              <li>Emitir licenças, recibos e comprovantes de compra (via Kiwify);</li>
              <li>Aprimorar o desempenho e segurança do aplicativo;</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Não vendemos, alugamos nem compartilhamos informações pessoais com terceiros sem consentimento, exceto quando exigido por lei.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">4. Serviços e terceiros utilizados</h2>
            <p className="text-gray-700 leading-relaxed">O MagikTools integra serviços de terceiros confiáveis:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li><strong>Clerk</strong> — Autenticação e gerenciamento de usuários;</li>
              <li><strong>OpenAI</strong> — Processamento de texto e inteligência artificial;</li>
              <li><strong>Kiwify</strong> — Processamento de pagamentos e controle de assinaturas;</li>
              <li><strong>Google OAuth</strong> — Login seguro com conta Google.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Cada parceiro segue suas próprias políticas de privacidade e práticas de segurança.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">5. Armazenamento e segurança</h2>
            <p className="text-gray-700 leading-relaxed">
              Os dados são armazenados em servidores seguros, com criptografia e controle de acesso restrito.<br />
              Adotamos medidas técnicas e organizacionais para evitar perda, alteração ou acesso não autorizado às informações.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">6. Direitos do usuário</h2>
            <p className="text-gray-700 leading-relaxed">O usuário pode:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li>Acessar e editar suas informações pessoais;</li>
              <li>Solicitar exclusão de conta;</li>
              <li>Revogar consentimentos;</li>
              <li>Pedir informações sobre o uso de seus dados.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Para exercer seus direitos, entre em contato por e-mail:<br />
              📩 <a href="mailto:suporte@magik.tools" className="text-blue-600 hover:underline">suporte@magik.tools</a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">7. Alterações desta política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos atualizar esta política a qualquer momento.<br />
              Alterações relevantes serão comunicadas diretamente aos usuários e entrarão em vigor na data de publicação no site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">8. Contato</h2>
            <p className="text-gray-700 leading-relaxed">
              Em caso de dúvidas ou solicitações, entre em contato:
            </p>
            <div className="text-gray-700 leading-relaxed space-y-1">
              <p><strong>MagikTools</strong></p>
              <p>E-mail: <a href="mailto:suporte@magik.tools" className="text-blue-600 hover:underline">suporte@magik.tools</a></p>
              <p>Website: <a href="https://app.magik.tools" className="text-blue-600 hover:underline">https://app.magik.tools</a></p>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-gray-600">
          <p>© 2025 <span className="font-bold">MagikTools</span> | Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
