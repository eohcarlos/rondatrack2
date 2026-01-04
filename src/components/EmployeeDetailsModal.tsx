import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Calendar, Car, Building, Clock } from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  age?: number;
  company_time_months?: number;
  driver_license?: string;
  shift: string;
  positions?: { title: string };
  condominiums?: { name: string };
}

interface EmployeeDetailsModalProps {
  employeeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeDetailsModal = ({ employeeId, isOpen, onClose }: EmployeeDetailsModalProps) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeId && isOpen) {
      loadEmployeeDetails();
    }
  }, [employeeId, isOpen]);

  const loadEmployeeDetails = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          age,
          company_time_months,
          driver_license,
          shift,
          positions (title),
          condominiums (name)
        `)
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftLabel = (shift: string) => {
    const shifts = {
      manha: 'Manhã',
      noite: 'Noite'
    };
    return shifts[shift as keyof typeof shifts] || shift;
  };

  const getShiftColor = (shift: string) => {
    const colors = {
      manha: 'bg-yellow-100 text-yellow-800',
      noite: 'bg-blue-100 text-blue-800'
    };
    return colors[shift as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Funcionário
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : employee ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-muted-foreground">{employee.positions?.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {employee.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{employee.phone}</span>
                      </div>
                    )}

                    {employee.age && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{employee.age} anos</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{employee.condominiums?.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Badge className={getShiftColor(employee.shift)}>
                        {getShiftLabel(employee.shift)}
                      </Badge>
                    </div>

                    {employee.company_time_months && (
                      <div className="col-span-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {Math.floor(employee.company_time_months / 12)} anos e {employee.company_time_months % 12} meses na empresa
                        </span>
                      </div>
                    )}

                    {employee.driver_license && (
                      <div className="col-span-2 flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>CNH: {employee.driver_license}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Funcionário não encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};