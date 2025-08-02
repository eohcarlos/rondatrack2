import { ReportsPanel } from '@/components/ReportsPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ReportsPageProps {
  onGoBack: () => void;
}

export const ReportsPage = ({ onGoBack }: ReportsPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={onGoBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
        <ReportsPanel onClose={onGoBack} />
      </div>
    </div>
  );
};