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
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Quote className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900">Frase do Dia</h3>
            <blockquote className="text-blue-800 italic font-medium">
              "{phrase.phrase}"
            </blockquote>
            {phrase.author && (
              <p className="text-blue-600 text-sm font-medium">
                — {phrase.author}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};