import { addDays, subDays } from 'date-fns';
import { calculateEaster } from './easter';

export interface HolidayEntry {
  date: Date;
  name: string;
  movable: boolean;
}

export function getPortugueseHolidays(year: number): HolidayEntry[] {
  const easter = calculateEaster(year);
  const goodFriday = subDays(easter, 2);
  const corpusChristi = addDays(easter, 60);

  return [
    { date: new Date(year, 0, 1), name: 'Ano Novo', movable: false },
    { date: goodFriday, name: 'Sexta-feira Santa', movable: true },
    { date: easter, name: 'Domingo de Páscoa', movable: true },
    { date: new Date(year, 3, 25), name: 'Dia da Liberdade', movable: false },
    { date: new Date(year, 4, 1), name: 'Dia do Trabalhador', movable: false },
    { date: corpusChristi, name: 'Corpo de Deus', movable: true },
    { date: new Date(year, 5, 10), name: 'Dia de Portugal', movable: false },
    { date: new Date(year, 7, 15), name: 'Assunção de Nossa Senhora', movable: false },
    { date: new Date(year, 9, 5), name: 'Implantação da República', movable: false },
    { date: new Date(year, 10, 1), name: 'Dia de Todos os Santos', movable: false },
    { date: new Date(year, 11, 1), name: 'Restauração da Independência', movable: false },
    { date: new Date(year, 11, 8), name: 'Imaculada Conceição', movable: false },
    { date: new Date(year, 11, 25), name: 'Natal', movable: false },
  ];
}
