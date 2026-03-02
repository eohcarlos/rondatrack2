import { ProfileSettings } from '@/components/ProfileSettings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="mb-4 max-w-lg mx-auto">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="rounded-xl hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
        <ProfileSettings onClose={() => navigate('/dashboard')} />
      </div>
    </div>
  );
};
