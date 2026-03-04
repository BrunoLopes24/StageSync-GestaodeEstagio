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
  totalRequiredHours: z.coerce.number().min(1, 'Campo obrigatório'),
  dailyWorkHours: z.coerce.number().min(0.5, 'Campo obrigatório').max(24),
  startDate: z.string().min(1, 'Campo obrigatório'),
  internshipTitle: z.string().min(1, 'Campo obrigatório'),
  organizationName: z.string().min(1, 'Campo obrigatório'),
  supervisorName: z.string().min(1, 'Campo obrigatório'),
  studentName: z.string().min(1, 'Campo obrigatório'),
  studentNumber: z.string().min(1, 'Campo obrigatório'),
  studentEmail: z.string().min(1, 'Campo obrigatório').email('Email inválido'),
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
        studentName: settings.studentName || '',
        studentNumber: settings.studentNumber || '',
        studentEmail: settings.studentEmail || '',
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
              {errors.internshipTitle && (
                <p className="mt-1 text-xs text-destructive">{errors.internshipTitle.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Organização</label>
              <Input {...register('organizationName')} placeholder="Nome da empresa" />
              {errors.organizationName && (
                <p className="mt-1 text-xs text-destructive">{errors.organizationName.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Orientador</label>
              <Input {...register('supervisorName')} placeholder="Nome do orientador" />
              {errors.supervisorName && (
                <p className="mt-1 text-xs text-destructive">{errors.supervisorName.message}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Informação Académica</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome do Estudante</label>
                <Input {...register('studentName')} placeholder="Nome completo do estudante" />
                {errors.studentName && (
                  <p className="mt-1 text-xs text-destructive">{errors.studentName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Número do Estudante</label>
                <Input {...register('studentNumber')} placeholder="Número mecanográfico" />
                {errors.studentNumber && (
                  <p className="mt-1 text-xs text-destructive">{errors.studentNumber.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input type="email" {...register('studentEmail')} placeholder="email@exemplo.com" />
                {errors.studentEmail && (
                  <p className="mt-1 text-xs text-destructive">{errors.studentEmail.message}</p>
                )}
              </div>
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
