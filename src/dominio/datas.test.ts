import { describe, expect, it } from 'vitest';
import {
  diaDaSemana,
  diaEstaAberto,
  diasUteis,
  hojeSP,
  minutosAteCorte,
  segundaDaSemana,
  semanaPadrao,
  dataValida,
  somarDias,
} from './datas';

describe('hojeSP', () => {
  it('usa o dia de São Paulo à noite, quando o UTC já virou o dia', () => {
    expect(hojeSP(new Date('2026-11-12T01:30:00Z'))).toBe('2026-11-11');
  });
  it('usa o mesmo dia de manhã', () => {
    expect(hojeSP(new Date('2026-11-11T10:00:00Z'))).toBe('2026-11-11');
  });
});

describe('diaDaSemana', () => {
  it('quarta é 3 e domingo é 0', () => {
    expect(diaDaSemana('2026-11-11')).toBe(3);
    expect(diaDaSemana('2026-11-15')).toBe(0);
  });
});

describe('somarDias', () => {
  it('atravessa o mês', () => {
    expect(somarDias('2026-11-30', 1)).toBe('2026-12-01');
    expect(somarDias('2026-11-16', -7)).toBe('2026-11-09');
  });
});

describe('segundaDaSemana', () => {
  it('sexta volta para a segunda', () => {
    expect(segundaDaSemana('2026-11-13')).toBe('2026-11-09');
  });
  it('domingo pertence à semana que acabou', () => {
    expect(segundaDaSemana('2026-11-15')).toBe('2026-11-09');
  });
});

describe('diasUteis', () => {
  it('lista segunda a sexta, mesmo na virada do mês', () => {
    expect(diasUteis('2026-11-30')).toEqual([
      '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04',
    ]);
  });
});

describe('diaEstaAberto', () => {
  it('fica aberto até 08:59 em São Paulo', () => {
    expect(diaEstaAberto('2026-11-11', new Date('2026-11-11T11:59:00Z'))).toBe(true);
  });
  it('fecha às 09:00 em São Paulo', () => {
    expect(diaEstaAberto('2026-11-11', new Date('2026-11-11T12:00:00Z'))).toBe(false);
  });
  it('dia futuro está aberto', () => {
    expect(diaEstaAberto('2026-11-12', new Date('2026-11-11T15:00:00Z'))).toBe(true);
  });
  it('dia passado está fechado', () => {
    expect(diaEstaAberto('2026-11-10', new Date('2026-11-11T10:00:00Z'))).toBe(false);
  });
  it('sábado está fechado', () => {
    expect(diaEstaAberto('2026-11-14', new Date('2026-11-13T10:00:00Z'))).toBe(false);
  });
  it('aceita outro horário de corte', () => {
    expect(diaEstaAberto('2026-11-11', new Date('2026-11-11T12:30:00Z'), '10:00')).toBe(true);
  });
});

describe('minutosAteCorte', () => {
  it('conta os minutos até o corte (faltam 1h20)', () => {
    expect(minutosAteCorte('2026-11-11', new Date('2026-11-11T10:40:00Z'))).toBe(80);
  });
  it('devolve null depois do corte', () => {
    expect(minutosAteCorte('2026-11-11', new Date('2026-11-11T12:10:00Z'))).toBeNull();
  });
});

describe('semanaPadrao', () => {
  it('de segunda a sexta, abre a semana atual', () => {
    expect(semanaPadrao('2026-11-11')).toBe('2026-11-09');
    expect(semanaPadrao('2026-11-13')).toBe('2026-11-09');
  });
  it('no sábado e no domingo, abre a próxima semana (a Simone planeja no domingo)', () => {
    expect(semanaPadrao('2026-11-14')).toBe('2026-11-16');
    expect(semanaPadrao('2026-11-15')).toBe('2026-11-16');
  });
});

describe('dataValida', () => {
  it('aceita uma data real', () => {
    expect(dataValida('2026-11-11')).toBe(true);
    expect(dataValida('2028-02-29')).toBe(true);
  });
  it('recusa data impossível ou texto qualquer', () => {
    expect(dataValida('2026-13-45')).toBe(false);
    expect(dataValida('2026-02-30')).toBe(false);
    expect(dataValida('abc')).toBe(false);
    expect(dataValida(undefined)).toBe(false);
    expect(dataValida(['2026-11-11'])).toBe(false);
  });
});
