import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
}

export const MonthSelector = ({ selectedMonth, onMonthChange }: MonthSelectorProps) => {
  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);

  const handlePreviousMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(currentMonth, 'yyyy-MM');
  const isPreviousMonth = format(selectedMonth, 'yyyy-MM') === format(previousMonth, 'yyyy-MM');

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">
              Período de Análise
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-[200px]">
              <Select 
                value={format(selectedMonth, 'yyyy-MM')} 
                onValueChange={(value) => onMonthChange(new Date(value + '-01'))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue>
                    {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={format(previousMonth, 'yyyy-MM')}>
                    {format(previousMonth, 'MMMM yyyy', { locale: ptBR })}
                  </SelectItem>
                  <SelectItem value={format(currentMonth, 'yyyy-MM')}>
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0"
              disabled={isCurrentMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={isPreviousMonth ? "default" : "outline"}
              size="sm"
              onClick={() => onMonthChange(previousMonth)}
              className="text-xs"
            >
              Mês Anterior
            </Button>
            <Button
              variant={isCurrentMonth ? "default" : "outline"}
              size="sm"
              onClick={() => onMonthChange(currentMonth)}
              className="text-xs"
            >
              Mês Atual
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};