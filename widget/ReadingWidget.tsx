import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import { t } from '@/services/i18n';
import type { ReadingWidgetData } from '@/widget/readingWidgetData';

/**
 * Widget "Lendo agora" da tela inicial do Android.
 *
 * Não é React Native de verdade: são as peças da biblioteca de widgets, que
 * viram views nativas. Cores só em hex, larguras em dp — por isso a barra de
 * progresso recebe a largura calculada a partir do tamanho do widget.
 */
const COR = {
  fundo: '#121212',
  borda: '#2A2A2A',
  texto: '#F6F6F6',
  apagado: '#9A9A9A',
  ouro: '#FF9900',
  trilho: '#2E2E2E'
} as const;

export function ReadingWidget({ data, width, height = 110 }: { data: ReadingWidgetData; width: number; height?: number }) {
  const { book } = data;

  // Pequeno (2×2 ou menos de largura): só a capa, com a barra de progresso
  // embaixo. O usuário escolhe o tamanho segurando o widget na tela inicial.
  if (book && width < 200) return <CompactWidget data={data} width={width} height={height} />;

  if (!book && width < 200) {
    return (
      <FlexWidget clickAction="OPEN_APP" style={{ height: 'match_parent', width: 'match_parent', backgroundColor: COR.fundo, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}>
        <ImageWidget image={require('../assets/brand-mark.png')} imageWidth={56} imageHeight={56} radius={14} />
      </FlexWidget>
    );
  }

  if (!book) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{ height: 'match_parent', width: 'match_parent', backgroundColor: COR.fundo, borderRadius: 22, borderWidth: 1, borderColor: COR.borda, padding: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flexGap: 14 }}
      >
        <ImageWidget image={require('../assets/brand-mark.png')} imageWidth={44} imageHeight={44} radius={12} />
        <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
          <TextWidget text={t('Nenhuma leitura em andamento')} style={{ fontSize: 15, fontWeight: '700', color: COR.texto }} maxLines={1} truncate="END" />
          <TextWidget text={t('Toque para escolher o próximo livro')} style={{ fontSize: 12, color: COR.apagado, marginTop: 4 }} maxLines={2} truncate="END" />
        </FlexWidget>
      </FlexWidget>
    );
  }

  const capaW = 62;
  const capaH = 92;
  // Largura útil da barra: widget menos padding (2×16), capa e espaço (14).
  const barra = Math.max(60, Math.round(width - 32 - capaW - 14));
  const cheio = Math.max(0, Math.min(barra, Math.round((barra * data.percent) / 100)));

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'readora://book/' + book.id }}
      accessibilityLabel={book.title}
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: COR.fundo, borderRadius: 22, borderWidth: 1, borderColor: COR.borda, padding: 16, flexDirection: 'row', alignItems: 'center', flexGap: 14 }}
    >
      {book.coverUrl ? (
        <ImageWidget image={book.coverUrl as `https:${string}`} imageWidth={capaW} imageHeight={capaH} radius={8} />
      ) : (
        <FlexWidget style={{ width: capaW, height: capaH, borderRadius: 8, backgroundColor: '#1B1814', justifyContent: 'center', alignItems: 'center' }}>
          <TextWidget text={book.title.slice(0, 1).toUpperCase()} style={{ fontSize: 30, fontWeight: '700', color: COR.ouro }} />
        </FlexWidget>
      )}

      <FlexWidget style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
        <TextWidget text={t('LENDO AGORA')} style={{ fontSize: 10, fontWeight: '700', color: COR.ouro, letterSpacing: 0.2 }} />
        <TextWidget text={book.title} style={{ fontSize: 16, fontWeight: '700', color: COR.texto, marginTop: 4 }} maxLines={2} truncate="END" />
        {book.author ? <TextWidget text={book.author} style={{ fontSize: 12, color: COR.apagado, marginTop: 2 }} maxLines={1} truncate="END" /> : null}

        <FlexWidget style={{ width: barra, height: 6, borderRadius: 3, backgroundColor: COR.trilho, marginTop: 10 }}>
          <FlexWidget style={{ width: cheio, height: 6, borderRadius: 3, backgroundColor: COR.ouro }} />
        </FlexWidget>
        <TextWidget text={data.line} style={{ fontSize: 11, color: COR.apagado, marginTop: 6 }} maxLines={1} truncate="END" />
      </FlexWidget>
    </FlexWidget>
  );
}

/** Versão só com a capa, para o widget pequeno. */
function CompactWidget({ data, width, height }: { data: ReadingWidgetData; width: number; height: number }) {
  const book = data.book!;
  const pad = 8;
  const barraAltura = 5;
  // A capa ocupa o que sobra, mantendo a proporção de livro (2:3).
  const altDisponivel = Math.max(40, height - pad * 2 - barraAltura - 6);
  const capaW = Math.max(30, Math.min(width - pad * 2, Math.round(altDisponivel * 0.66)));
  const capaH = Math.round(capaW * 1.5);
  const cheio = Math.round((capaW * data.percent) / 100);
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'readora://book/' + book.id }}
      accessibilityLabel={book.title}
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: COR.fundo, borderRadius: 22, padding: pad, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      {book.coverUrl ? (
        <ImageWidget image={book.coverUrl as `https:${string}`} imageWidth={capaW} imageHeight={capaH} radius={8} />
      ) : (
        <FlexWidget style={{ width: capaW, height: capaH, borderRadius: 8, backgroundColor: '#1B1814', justifyContent: 'center', alignItems: 'center' }}>
          <TextWidget text={book.title.slice(0, 1).toUpperCase()} style={{ fontSize: 28, fontWeight: '700', color: COR.ouro }} />
        </FlexWidget>
      )}
      <FlexWidget style={{ width: capaW, height: barraAltura, borderRadius: 3, backgroundColor: COR.trilho, marginTop: 6 }}>
        <FlexWidget style={{ width: cheio, height: barraAltura, borderRadius: 3, backgroundColor: COR.ouro }} />
      </FlexWidget>
    </FlexWidget>
  );
}
