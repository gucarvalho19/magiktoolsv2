import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-6 bg-background">
      <hr className="border-t border-border" />
      <div className="flex flex-col items-center py-6 space-y-1">
        <p className="text-sm text-[#6B7280]">
          © 2025 <span className="font-bold">MagikTools</span> | Todos os direitos reservados
        </p>
        <p className="text-sm text-[#6B7280]">
          E-mail de suporte: suporte@magik.tools
        </p>
        <div className="text-sm text-[#6B7280] flex gap-2">
          <Link to="/politica-de-privacidade" className="hover:underline">Política de Privacidade</Link>
          <span>•</span>
          <Link to="/termos-de-uso" className="hover:underline">Termos de Uso</Link>
        </div>
        <p className="text-sm text-[#6B7280]">
          Powered by <span className="font-bold">OpenAI</span> • Autenticação via <span className="font-bold">Clerk</span>
        </p>
      </div>
    </footer>
  );
}
