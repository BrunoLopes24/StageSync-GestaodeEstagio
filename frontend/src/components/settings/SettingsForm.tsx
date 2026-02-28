import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { Settings as SettingsIcon } from 'lucide-react';

const schema = z.object({
  totalRequiredHours: z.coerce.number().min(1),
  dailyWorkHours: z.coerce.number().min(0.5).max(24),
  startDate: z.string().min(1),
  internshipTitle: z.string().optional(),
  organizationName: z.string().optional(),
  supervisorName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  useEffect(() => {
    if (settings) {
      reset({
        totalRequiredHours: settings.totalRequiredHours,
        dailyWorkHours: settings.dailyWorkHours,
        startDate: settings.startDate?.split('T')[0] || '',
        internshipTitle: settings.internshipTitle || '',
        organizationName: settings.organizationName || '',
        supervisorName: settings.supervisorName || '',
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: FormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) return <div className="text-muted-foreground">A carregar...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          Configurações do Estágio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Total de Horas Necessárias</label>
              <Input type="number" step="1" {...register('totalRequiredHours')} />
              {errors.totalRequiredHours && (
                <p className="mt-1 text-xs text-destructive">{errors.totalRequiredHours.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Horas Diárias</label>
              <Input type="number" step="0.5" {...register('dailyWorkHours')} />
              {errors.dailyWorkHours && (
                <p className="mt-1 text-xs text-destructive">{errors.dailyWorkHours.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Data de Início</label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="mt-1 text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Título do Estágio</label>
              <Input {...register('internshipTitle')} placeholder="Ex: Estágio em Eng. Informática" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Organização</label>
              <Input {...register('organizationName')} placeholder="Nome da empresa" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Orientador</label>
              <Input {...register('supervisorName')} placeholder="Nome do orientador" />
            </div>
          </div>

          {updateMutation.isSuccess && (
            <p className="text-sm text-success">Definições guardadas com sucesso!</p>
          )}
          {updateMutation.error && (
            <p className="text-sm text-destructive">{updateMutation.error.message}</p>
          )}

          <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending ? 'A guardar...' : 'Guardar Definições'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
