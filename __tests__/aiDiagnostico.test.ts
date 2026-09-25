import { aiDiagnostico } from '@/services/bookEnrichment';
import { coverLooksReal, resetCoverProbeCache } from '@/services/coverProbe';

/**
 * As tres falhas da IA devolviam `null` identico: chave ausente, chave
 * invalida e "o modelo nao conhece o livro". Da tela, e impossivel saber qual
 * foi — e so a primeira o usuario consegue consertar.
 */
describe('diagnostico da IA', () => {
  it('avisa quando a chave nao esta configurada', () => {
    expect(aiDiagnostico(['desligada', 'nao-conhece'])).toContain('desligada');
  });

  it('problema de configuracao vence "nao conhece o livro"', () => {
    // O usuario so pode agir sobre o primeiro; mostrar o outro esconderia a
    // unica informacao acionavel.
    const texto = aiDiagnostico(['nao-conhece', 'desligada', 'falhou']);
    expect(texto).toContain('desligada');
    expect(texto).not.toContain('não conhece');
  });

  it('distingue falha de resposta de desconhecimento', () => {
    expect(aiDiagnostico(['falhou'])).toContain('não respondeu');
    expect(aiDiagnostico(['nao-conhece'])).toContain('não conhece');
  });

  it('nao diz nada quando a IA nao precisou entrar', () => {
    expect(aiDiagnostico(['nao-precisou', 'preencheu'])).toBe('');
  });
});

describe('sonda de capa', () => {
  beforeEach(() => { resetCoverProbeCache(); });
  afterEach(() => { (global as any).fetch = undefined; });

  function resposta(over: Partial<{ ok: boolean; url: string; type: string; length: string }> = {}) {
    const { ok = true, url = 'https://books.google.com/books/content?id=a', type = 'image/jpeg', length = '48000' } = over;
    return jest.fn(() => Promise.resolve({
      ok,
      url,
      headers: { get: (h: string) => (h === 'content-type' ? type : h === 'content-length' ? length : null) }
    }));
  }

  it('reprova quando o endereco final e o placeholder do Google', async () => {
    // O catalogo devolve o endereco normal de capa; o placeholder so aparece
    // DEPOIS do redirecionamento — por isso olhar a URL original nao bastava.
    (global as any).fetch = resposta({ url: 'https://books.google.com/googlebooks/images/no_cover_thumb.gif' });
    expect(await coverLooksReal('https://books.google.com/books/content?id=a')).toBe(false);
  });

  it('reprova imagem pequena demais para ser capa', async () => {
    (global as any).fetch = resposta({ length: '900' });
    expect(await coverLooksReal('https://covers.openlibrary.org/b/isbn/1-M.jpg')).toBe(false);
  });

  it('reprova resposta que nem imagem e', async () => {
    (global as any).fetch = resposta({ type: 'text/html' });
    expect(await coverLooksReal('https://x/capa.jpg')).toBe(false);
  });

  it('aprova capa de verdade', async () => {
    (global as any).fetch = resposta();
    expect(await coverLooksReal('https://books.google.com/books/content?id=b')).toBe(true);
  });

  it('sem rede, nao esconde a capa', async () => {
    // Falha de conexao nao e prova de que a capa e falsa.
    (global as any).fetch = jest.fn(() => Promise.reject(new Error('offline')));
    expect(await coverLooksReal('https://x/capa.jpg')).toBe(true);
  });

  it('consulta cada endereco uma vez so', async () => {
    const f = resposta();
    (global as any).fetch = f;
    await coverLooksReal('https://x/mesma.jpg');
    await coverLooksReal('https://x/mesma.jpg');
    expect(f).toHaveBeenCalledTimes(1);
  });
});
