import fs from 'fs';
import path from 'path';

const raiz = path.resolve(__dirname, '..');
const pastas = ['services', 'contexts', 'components', 'app'];

function arquivosDeCodigo(dir: string): string[] {
  const alvo = path.join(raiz, dir);
  if (!fs.existsSync(alvo)) return [];
  return fs.readdirSync(alvo, { withFileTypes: true }).flatMap((entrada) => {
    const cheio = path.join(alvo, entrada.name);
    if (entrada.isDirectory()) return arquivosDeCodigo(path.join(dir, entrada.name));
    return /\.tsx?$/.test(entrada.name) ? [cheio] : [];
  });
}

/**
 * "Excluir minha conta e meus dados" é exigência do Google Play, e uma chave
 * esquecida significa dado do usuário sobrevivendo a uma exclusão que o app
 * prometeu ser definitiva.
 *
 * Em vez de repetir a lista à mão, o teste varre o código atrás de chaves
 * `@readora*` e cobra que todas estejam na lista de limpeza. Assim, quem criar
 * uma chave nova amanhã descobre aqui, e não numa reclamação de usuário.
 */
describe('limpeza local de dados', () => {
  const fonte = fs.readFileSync(path.join(raiz, 'services/localWipe.ts'), 'utf8');
  const chavesLimpas = new Set(Array.from(fonte.matchAll(/'(@readora[a-z_]*)'/g)).map((m) => m[1]));

  it('cobre todas as chaves de armazenamento usadas no app', () => {
    const usadas = new Set<string>();
    pastas.flatMap(arquivosDeCodigo).forEach((arquivo) => {
      if (arquivo.endsWith('localWipe.ts')) return;
      const conteudo = fs.readFileSync(arquivo, 'utf8');
      Array.from(conteudo.matchAll(/'(@readora[a-z_]*)'/g)).forEach((m) => usadas.add(m[1]));
    });

    expect(usadas.size).toBeGreaterThan(0);
    const esquecidas = [...usadas].filter((chave) => !chavesLimpas.has(chave));
    expect(esquecidas).toEqual([]);
  });

  it('nao lista chave que ninguem mais usa, fora as legadas conhecidas', () => {
    // reading_sessions ficou de proposito: aparelhos que nao abriram a versao
    // que removeu a feature ainda tem essa chave gravada.
    const legadasPropositais = ['@readora_native_reading_sessions'];
    const usadas = new Set<string>();
    pastas.flatMap(arquivosDeCodigo).forEach((arquivo) => {
      const conteudo = fs.readFileSync(arquivo, 'utf8');
      Array.from(conteudo.matchAll(/'(@readora[a-z_]*)'/g)).forEach((m) => usadas.add(m[1]));
    });
    const orfas = [...chavesLimpas].filter((chave) => !usadas.has(chave) && !legadasPropositais.includes(chave));
    expect(orfas).toEqual([]);
  });
});
