import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function DevPreviewBanner() {
  return (
    <Alert className="mb-4 border-orange-500/50 bg-orange-500/10">
      <AlertCircle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="text-orange-700 dark:text-orange-400">
        <strong>Dev Preview:</strong> Esta funcionalidade está em desenvolvimento e disponível apenas para administradores em ambientes de desenvolvimento/preview.
      </AlertDescription>
    </Alert>
  );
}
