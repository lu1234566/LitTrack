import { parsePageCount, repairedPageCount } from '@/services/pageCount';

describe('numero de paginas', () => {
  it('le separador de milhar como milhar', () => {
    expect(parsePageCount('1.087')).toBe(1087);
    expect(parsePageCount('1,087')).toBe(1087);
    expect(parsePageCount('1 087')).toBe(1087);
  });

  it('aceita texto em volta e pega o primeiro numero', () => {
    expect(parsePageCount('320')).toBe(320);
    expect(parsePageCount('320 páginas')).toBe(320);
    expect(parsePageCount('320-350')).toBe(320);
    expect(parsePageCount('')).toBe(0);
    expect(parsePageCount(undefined)).toBe(0);
  });

  it('conserta o que ja foi salvo como decimal', () => {
    expect(repairedPageCount(1.087)).toBe(1087);
    expect(repairedPageCount(1.08)).toBe(1080);
    expect(repairedPageCount(150.6)).toBe(151);
    expect(repairedPageCount(352)).toBe(352);
    expect(repairedPageCount(0)).toBe(0);
    expect(parsePageCount(1.087)).toBe(1087);
  });
});
