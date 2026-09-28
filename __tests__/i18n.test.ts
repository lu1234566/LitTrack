import { languageFromLocale, translateForLanguage } from '@/services/i18n';
import { en } from '@/services/locales/en';

const em = (s: string) => translateForLanguage(s, 'en');

describe('idioma do sistema', () => {
  it('portugues de qualquer pais fica em portugues', () => {
    expect(languageFromLocale('pt-BR')).toBe('pt');
    expect(languageFromLocale('pt-PT')).toBe('pt');
    expect(languageFromLocale('pt')).toBe('pt');
  });

  it('qualquer outro idioma recebe ingles', () => {
    expect(languageFromLocale('en-US')).toBe('en');
    expect(languageFromLocale('es-ES')).toBe('en');
    expect(languageFromLocale('ja-JP')).toBe('en');
  });
});

describe('traducao para ingles', () => {
  it('traduz frase exata e preserva os espacos das pontas', () => {
    expect(em('Baixar dados que faltam')).toBe('Fetch missing data');
    // Pedaço de JSX ao lado de um número: o espaço separa do valor.
    expect(em('Incompletos agora: ')).toBe('Incomplete now: ');
  });

  it('nao mexe em conteudo do usuario', () => {
    // Título, citação e resenha não estão no dicionário e passam intactos.
    expect(em('Dom Casmurro')).toBe('Dom Casmurro');
    expect(em('Olhos de cigana oblíqua e dissimulada.')).toBe('Olhos de cigana oblíqua e dissimulada.');
  });

  it('traduz listas so quando todas as partes sao conhecidas', () => {
    expect(em('Mágico, Sombrio')).toBe('Magical, Dark');
    // Uma parte desconhecida = provavelmente texto do usuário: não toca.
    expect(em('Mágico, Capitu')).toBe('Mágico, Capitu');
  });

  it('mensagens montadas com numeros', () => {
    expect(em('Procurando... 3 de 5 (1 atualizados)')).toBe('Searching... 3 of 5 (1 updated)');
    expect(em('2 de 5 livro(s) atualizados. Em 3 livro(s) fiquei na dúvida — escolha abaixo.'))
      .toBe('2 of 5 book(s) updated. I was unsure about 3 book(s) — choose below.');
    expect(em('TurtleMe · falta páginas, capa')).toBe('TurtleMe · missing pages, cover');
  });

  it('linha de relatorio traduz os campos mas nao o titulo', () => {
    expect(em('• Vidas Secas: páginas, sinopse (ainda falta capa)'))
      .toBe('• Vidas Secas: pages, synopsis (still missing cover)');
  });

  it('texto sem letras passa direto', () => {
    expect(em('4.5')).toBe('4.5');
    expect(em(' · ')).toBe(' · ');
  });
});

describe('dicionario', () => {
  it('nenhuma traducao vazia ou igual a chave por engano em frases longas', () => {
    const suspeitas = Object.entries(en).filter(([k, v]) => !v.trim() || (k.length > 25 && k === v && !/READORA/.test(k)));
    expect(suspeitas).toEqual([]);
  });
});
