import { looksLikeHtml, stripHtml } from '@/services/plainText';

describe('stripHtml', () => {
  it('limpa a sinopse do Google Books mantendo o texto legível', () => {
    // Trecho real devolvido pela API (livro "You Killed Me First").
    const raw =
      '<p><b>"Electrifying and page-turning, John Marrs is not to be missed."--#1 ' +
      '<i>New York Times</i> bestselling author Freida McFadden</b></p> ' +
      '<p><b>"This is trademark John Marrs and then some."--<i>Sunday Times</i></b></p>';

    expect(stripHtml(raw)).toBe(
      '"Electrifying and page-turning, John Marrs is not to be missed."--#1 New York Times bestselling author Freida McFadden\n\n' +
      '"This is trademark John Marrs and then some."--Sunday Times'
    );
  });

  it('preserva parágrafos e converte <br> em quebra de linha', () => {
    expect(stripHtml('<p>Primeiro</p><p>Segundo<br>terceiro</p>')).toBe('Primeiro\n\nSegundo\nterceiro');
  });

  it('transforma itens de lista em marcadores', () => {
    expect(stripHtml('<ul><li>Um</li><li>Dois</li></ul>')).toBe('• Um\n• Dois');
  });

  it('decodifica entidades nomeadas e numéricas', () => {
    expect(stripHtml('&quot;aspas&quot; &amp; &#39;simples&#39;')).toBe('"aspas" & \'simples\'');
    expect(stripHtml('caf&#233; &#x63;om leite')).toBe('café com leite');
    expect(stripHtml('tra&ccedil;o &mdash; e retic&hellip;')).toBe('traço — e retic…');
  });

  it('decodifica acentos em forma nomeada, respeitando maiúsculas', () => {
    expect(stripHtml('Ma&ccedil;&atilde; e cora&ccedil;&atilde;o')).toBe('Maçã e coração');
    expect(stripHtml('&Aacute;gua, &Ccedil;u e &Eacute;den')).toBe('Água, Çu e Éden');
    expect(stripHtml('Mem&oacute;rias P&oacute;stumas de Br&aacute;s Cubas')).toBe('Memórias Póstumas de Brás Cubas');
  });

  it('mantém intacta uma entidade que não conhece', () => {
    expect(stripHtml('simbolo &naoexiste; aqui')).toBe('simbolo &naoexiste; aqui');
  });

  it('não deixa um &#; malformado derrubar a tela', () => {
    expect(() => stripHtml('&#99999999999;')).not.toThrow();
    expect(stripHtml('antes &#99999999999; depois')).toBe('antes depois');
  });

  it('remove script e style junto com o conteúdo', () => {
    expect(stripHtml('Texto<script>alert(1)</script> final')).toBe('Texto final');
  });

  it('não transforma em tag um sinal de menor que veio escapado', () => {
    // O autor escreveu literalmente "<p>" no texto; deve sobreviver.
    expect(stripHtml('use &lt;p&gt; para paragrafos')).toBe('use <p> para paragrafos');
  });

  it('colapsa espaços e quebras excessivas', () => {
    expect(stripHtml('<p>a</p><p></p><p></p><p>b</p>')).toBe('a\n\nb');
    expect(stripHtml('muito     espaco')).toBe('muito espaco');
  });

  it('trata entrada vazia, nula e indefinida', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
  });

  it('deixa texto simples intacto', () => {
    const limpo = 'Um jovem encontra uma pedra azul que revela ser um ovo de dragao.';
    expect(stripHtml(limpo)).toBe(limpo);
  });
});

describe('looksLikeHtml', () => {
  it('reconhece marcação e entidades', () => {
    expect(looksLikeHtml('<p>oi</p>')).toBe(true);
    expect(looksLikeHtml('aspas &quot;assim&quot;')).toBe(true);
    expect(looksLikeHtml('numérica &#233;')).toBe(true);
  });

  it('não acusa texto comum', () => {
    expect(looksLikeHtml('Um livro sobre 5 < 7 e nada mais')).toBe(false);
    expect(looksLikeHtml('')).toBe(false);
    expect(looksLikeHtml(undefined)).toBe(false);
  });
});
