/**
 * O Gemini devolve 503 ("high demand") com frequencia no plano gratuito, e o
 * pico dura segundos. Antes, um unico 503 virava "a IA nao respondeu" para o
 * livro inteiro.
 */
jest.mock('@/services/firebaseNative', () => ({ nativeAuth: null }));

type Resposta = { status: number; body?: unknown };

function carregar(respostas: Resposta[]) {
  const urls: string[] = [];
  (global as any).fetch = jest.fn((url: string) => {
    urls.push(url);
    const r = respostas.shift() || { status: 500 };
    return Promise.resolve({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => JSON.stringify(r.body || { error: { message: 'erro ' + r.status } }),
      json: async () => r.body
    });
  });
  let mod: typeof import('@/services/aiClient');
  jest.isolateModules(() => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'teste';
    delete process.env.EXPO_PUBLIC_AI_PROXY_URL;
    delete process.env.EXPO_PUBLIC_GEMINI_MODEL;
    mod = require('@/services/aiClient');
  });
  return { mod: mod!, urls };
}

const ok = {
  status: 200,
  body: { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"description":"Sinopse","totalPages":300,"genre":"Fantasia"}' }] } }] }
};

/** Deixa as esperas entre tentativas passarem sem gastar tempo real. */
async function rodar<T>(promessa: Promise<T>): Promise<T> {
  let pronto = false;
  promessa.finally(() => { pronto = true; });
  while (!pronto) await jest.advanceTimersByTimeAsync(500);
  return promessa;
}

describe('IA tenta de novo e troca de modelo', () => {
  // As esperas entre tentativas (1,5 s e 4 s) passam em milissegundos.
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); (global as any).fetch = undefined; });

  it('pico de demanda passageiro nao chega ao usuario', async () => {
    const { mod, urls } = carregar([{ status: 503 }, { status: 503 }, ok]);
    const r = await rodar(mod.fetchBookFactsDetailed('Livro', 'Autor'));
    expect(r.status).toBe('ok');
    expect(urls).toHaveLength(3);
  });

  const lista = {
    status: 200,
    body: {
      models: [
        { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-9', supportedGenerationMethods: ['embedContent'] }
      ]
    }
  };

  it('se o principal nao sai do 503, usa um reserva que o Google diz existir', async () => {
    const { mod, urls } = carregar([{ status: 503 }, { status: 503 }, { status: 503 }, lista, ok]);
    const r = await rodar(mod.fetchBookFactsDetailed('Livro', 'Autor'));
    expect(r.status).toBe('ok');
    expect(urls[3]).toContain('/v1beta/models?');
    // O nome veio da lista, nao de um palpite.
    expect(urls[4]).toContain('gemini-3.5-flash-lite:generateContent');
  });

  it('se o reserva falhar, a tela mostra o erro do principal', async () => {
    // Antes o 404 do reserva escondia o motivo real (a sobrecarga).
    const { mod } = carregar([{ status: 503 }, { status: 503 }, { status: 503 }, lista, { status: 404 }]);
    const r = await rodar(mod.fetchBookFactsDetailed('Livro', 'Autor'));
    expect(r.status).toBe('error');
    expect(r.detail).toContain('503');
  });

  it('escolhe reservas flash de texto, as leves primeiro', () => {
    const { mod } = carregar([]);
    const nomes = ['models/gemini-3.8-flash', 'models/gemini-3.8-flash-image', 'models/gemini-3.5-flash',
      'models/gemini-3.5-flash-lite', 'models/gemini-3.8-pro', 'models/gemini-3.9-flash-preview'];
    expect(mod.pickFallbackModels(nomes, 'gemini-3.8-flash')).toEqual(['gemini-3.5-flash-lite', 'gemini-3.5-flash']);
  });

  it('chave invalida nao fica insistindo', async () => {
    // 400 nao passa com o tempo nem com outro modelo: uma chamada so.
    const { mod, urls } = carregar([{ status: 400 }, ok]);
    const r = await mod.fetchBookFactsDetailed('Livro', 'Autor');
    expect(r.status).toBe('error');
    expect(urls).toHaveLength(1);
  });

  it('nao manda thinkingBudget para modelo que nao e 2.5', async () => {
    const { mod } = carregar([ok]);
    await mod.fetchBookFactsDetailed('Livro', 'Autor');
    const corpo = JSON.parse(((global as any).fetch as jest.Mock).mock.calls[0][1].body);
    expect(corpo.generationConfig.thinkingConfig).toBeUndefined();
  });
});
