import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Termos de Uso — MagikTools';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Leia as condições gerais de uso e assinatura da plataforma MagikTools.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Leia as condições gerais de uso e assinatura da plataforma MagikTools.';
      document.head.appendChild(meta);
    }

    const linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) {
      linkCanonical.setAttribute('href', 'https://app.magik.tools/termos-de-uso');
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = 'https://app.magik.tools/termos-de-uso';
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📜 Termos de Uso — MagikTools</h1>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. Introdução</h2>
            <p className="text-gray-700 leading-relaxed">
              Bem-vindo(a) ao MagikTools, plataforma de ferramentas inteligentes e automações desenvolvida para otimizar processos digitais e produtivos.<br />
              Ao acessar e utilizar o aplicativo disponível em <a href="https://app.magik.tools" className="text-blue-600 hover:underline">https://app.magik.tools</a>, você concorda com os presentes Termos de Uso e com nossa Política de Privacidade.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Caso não concorde com qualquer parte destes termos, recomendamos que não utilize a plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. Definições</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li><strong>Usuário:</strong> qualquer pessoa que acesse, utilize ou crie uma conta no MagikTools.</li>
              <li><strong>Plataforma:</strong> o ambiente digital disponível em <a href="https://app.magik.tools" className="text-blue-600 hover:underline">https://app.magik.tools</a>.</li>
              <li><strong>Serviços:</strong> todas as ferramentas, automações e integrações disponibilizadas pelo MagikTools.</li>
              <li><strong>Conta:</strong> cadastro criado pelo usuário para acessar funcionalidades restritas, autenticado via Clerk.</li>
              <li><strong>Assinatura:</strong> licença de uso adquirida por meio da plataforma Kiwify.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. Acesso e cadastro</h2>
            <p className="text-gray-700 leading-relaxed">
              Para utilizar os recursos da plataforma, o usuário deve possuir uma conta ativa e autenticada via Clerk (login com e-mail, senha ou conta Google).<br />
              O usuário é responsável por:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li>Manter a confidencialidade de suas credenciais;</li>
              <li>Garantir a veracidade das informações fornecidas;</li>
              <li>Comunicar imediatamente qualquer uso não autorizado de sua conta.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              O MagikTools reserva-se o direito de suspender ou excluir contas que violem estes Termos ou apresentem atividade suspeita.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">4. Planos, assinaturas e pagamentos</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li>As assinaturas são processadas exclusivamente pela Kiwify, conforme os planos e valores disponíveis na página de vendas oficial.</li>
              <li>O pagamento é intermediado de forma segura pela Kiwify.</li>
              <li>O MagikTools não armazena dados financeiros do usuário (como números de cartão).</li>
              <li>A renovação de assinatura segue as regras da Kiwify (mensal, anual ou única).</li>
              <li>Cancelamentos, reembolsos ou disputas devem ser solicitados diretamente à Kiwify ou à equipe de suporte do MagikTools.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">5. Uso adequado da plataforma</h2>
            <p className="text-gray-700 leading-relaxed">
              O usuário compromete-se a utilizar o MagikTools de forma ética e legal, abstendo-se de:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li>Praticar atividades fraudulentas, invasivas ou que prejudiquem o funcionamento da plataforma;</li>
              <li>Reproduzir, copiar ou redistribuir qualquer parte do serviço sem autorização expressa;</li>
              <li>Tentar acessar dados ou sistemas de outros usuários;</li>
              <li>Utilizar os recursos de IA para gerar conteúdos ilegais, ofensivos, enganosos ou que violem direitos autorais.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              O descumprimento poderá resultar em suspensão imediata de acesso, sem reembolso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">6. Propriedade intelectual</h2>
            <p className="text-gray-700 leading-relaxed">
              Todo o conteúdo, marca, interface e código do MagikTools são de propriedade exclusiva da equipe responsável pelo projeto.<br />
              É proibido o uso, cópia ou reprodução total ou parcial sem autorização prévia e expressa.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">7. Responsabilidade</h2>
            <p className="text-gray-700 leading-relaxed">
              O MagikTools é uma plataforma SaaS em constante evolução e busca oferecer estabilidade e segurança.<br />
              Entretanto, não garante disponibilidade ininterrupta, nem se responsabiliza por:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed ml-4">
              <li>Falhas de conexão, erros externos ou serviços de terceiros (Clerk, Kiwify, OpenAI, etc.);</li>
              <li>Decisões tomadas com base em informações geradas pelas ferramentas;</li>
              <li>Dano indireto, perda de lucro ou prejuízo decorrente do uso da plataforma.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">8. Privacidade e segurança</h2>
            <p className="text-gray-700 leading-relaxed">
              O tratamento de dados pessoais segue rigorosamente nossa <a href="/politica-de-privacidade" className="text-blue-600 hover:underline">Política de Privacidade</a>.<br />
              Nenhum dado é compartilhado com terceiros sem consentimento, salvo quando exigido por lei.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">9. Suporte e contato</h2>
            <p className="text-gray-700 leading-relaxed">
              O suporte é prestado prioritariamente via e-mail:<br />
              📩 <a href="mailto:suporte@magik.tools" className="text-blue-600 hover:underline">suporte@magik.tools</a>
            </p>
            <p className="text-gray-700 leading-relaxed">
              Dúvidas sobre assinaturas, pagamentos ou cancelamentos devem ser direcionadas ao mesmo canal.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">10. Alterações nos Termos</h2>
            <p className="text-gray-700 leading-relaxed">
              O MagikTools poderá atualizar estes Termos a qualquer momento, publicando nova versão nesta mesma página.<br />
              A continuidade de uso após alterações implica aceitação integral das novas condições.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">11. Foro</h2>
            <p className="text-gray-700 leading-relaxed">
              Fica eleito o foro da Comarca de Curitiba – PR, com renúncia a qualquer outro, para dirimir eventuais litígios relacionados ao uso da plataforma.
            </p>
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
