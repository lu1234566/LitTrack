import fs from 'fs';
import path from 'path';

/**
 * Arquivos `.native.ts(x)` / `.web.ts(x)` não funcionam com o atalho `@/`:
 * ele resolve direto para o `.ts` e o app Android usava a versão vazia do
 * widget sem ninguém perceber. Plataforma se decide com Platform.OS.
 */
describe('sem arquivos por plataforma', () => {
  it('nenhum .native/.web/.android/.ios no codigo do app', () => {
    const raiz = path.join(__dirname, '..');
    const achados: string[] = [];
    const varrer = (dir: string) => {
      for (const nome of fs.readdirSync(dir)) {
        if (['node_modules', '.git', 'dist', 'android', 'ios', 'functions', 'src'].includes(nome)) continue;
        const caminho = path.join(dir, nome);
        if (fs.statSync(caminho).isDirectory()) varrer(caminho);
        else if (/\.(native|web|android|ios)\.tsx?$/.test(nome)) achados.push(path.relative(raiz, caminho));
      }
    };
    varrer(raiz);
    expect(achados).toEqual([]);
  });
});
