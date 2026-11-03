const prefetch = jest.fn();
jest.mock('react-native', () => ({ Image: { prefetch: (...args: unknown[]) => prefetch(...args) } }));

import { comPrazo, esperarNoMaximo, preloadCovers } from '@/services/imagePreload';

describe('imagePreload', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    prefetch.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it('segue depois do prazo quando uma capa nunca chega', async () => {
    prefetch.mockReturnValue(new Promise(() => {}));
    let terminou = false;
    const espera = preloadCovers(['https://exemplo.com/capa.jpg'], 2500).then(() => { terminou = true; });
    await jest.advanceTimersByTimeAsync(2499);
    expect(terminou).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await espera;
    expect(terminou).toBe(true);
  });

  it('só busca capas remotas, sem repetir', async () => {
    prefetch.mockResolvedValue(true);
    await preloadCovers(['https://a/1.jpg', 'https://a/1.jpg', 'data:image/png;base64,xx', 'file:///capa.jpg', undefined, null]);
    expect(prefetch).toHaveBeenCalledTimes(1);
    expect(prefetch).toHaveBeenCalledWith('https://a/1.jpg');
  });

  it('uma capa com erro não impede as outras', async () => {
    prefetch.mockRejectedValueOnce(new Error('404')).mockResolvedValueOnce(true);
    await expect(preloadCovers(['https://a/1.jpg', 'https://a/2.jpg'])).resolves.toBeUndefined();
  });

  it('esperarNoMaximo resolve antes do prazo quando a promessa termina', async () => {
    await expect(esperarNoMaximo(Promise.resolve('ok'), 1000)).resolves.toBeUndefined();
  });

  it('comPrazo rejeita quando a captura não volta', async () => {
    const captura = comPrazo(new Promise<string>(() => {}), 15000, 'captura');
    const verificacao = expect(captura).rejects.toThrow('captura');
    await jest.advanceTimersByTimeAsync(15000);
    await verificacao;
  });

  it('comPrazo devolve o resultado dentro do prazo', async () => {
    await expect(comPrazo(Promise.resolve('file:///x.png'), 15000, 'captura')).resolves.toBe('file:///x.png');
  });
});
