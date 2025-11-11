import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

interface DailyPhraseData {
  phrase: string;
  author?: string;
}

export const DailyPhrase = () => {
  const [phrase, setPhrase] = useState<DailyPhraseData | null>(null);

  useEffect(() => {
    loadDailyPhrase();
  }, []);

  const loadDailyPhrase = async () => {
    try {
      // Pegar uma frase aleatória baseada no dia atual
      const today = new Date().toISOString().split('T')[0];
      const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      
      const { data, error } = await supabase
        .from('daily_phrases')
        .select('phrase, author');

      if (error) throw error;

      if (data && data.length > 0) {
        // Usar o dia do ano para selecionar uma frase específica (rotação diária)
        const phraseIndex = dayOfYear % data.length;
        setPhrase(data[phraseIndex]);
      }
    } catch (error) {
      console.error('Erro ao carregar frase do dia:', error);
      // Frase padrão em caso de erro
      setPhrase({
        phrase: 'A excelência não é um ato, mas um hábito.',
        author: 'Aristóteles'
      });
    }
  };

  if (!phrase) return null;

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-50"></div>
      <CardContent className="relative p-6">
        <div className="flex items-start gap-4">
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-md group-hover:blur-lg transition-all opacity-50"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
              <Quote className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              Frase do Dia
              <span className="text-xs font-normal text-muted-foreground">✨</span>
            </h3>
            <blockquote className="text-foreground/90 italic font-medium text-base leading-relaxed">
              "{phrase.phrase}"
            </blockquote>
            {phrase.author && (
              <p className="text-primary text-sm font-semibold">
                — {phrase.author}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};