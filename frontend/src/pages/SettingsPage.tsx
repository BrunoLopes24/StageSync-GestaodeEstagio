import { SettingsForm } from '@/components/settings/SettingsForm';
import { HolidayManager } from '@/components/settings/HolidayManager';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Definições</h2>
        <p className="text-sm text-muted-foreground">
          Configure os parâmetros do estágio e gira os feriados.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsForm />
        <HolidayManager />
      </div>
    </div>
  );
}
