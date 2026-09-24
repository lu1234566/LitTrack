import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ReadoraIcon } from '@/components/ReadoraIcon';
import { CoverCandidate, searchBookCovers } from '@/services/externalBookSearch';
import { pickImageAsDataUrl } from '@/services/webPlatformTools';
import { appColors } from '@/theme/tokens';

/**
 * Tudo relativo à capa de um livro, em um lugar só: prévia, busca por título,
 * escolha entre as capas encontradas, imagem da galeria, URL manual e remoção.
 *
 * Antes isto estava duplicado e incompleto entre Adicionar e Editar — a tela
 * de adicionar não buscava capa nenhuma, a de editar pegava a primeira que
 * aparecesse sem deixar escolher, e nenhuma das duas tinha como remover.
 */
export function CoverPicker({
  title,
  author,
  isbn = '',
  value,
  onChange
}: {
  title: string;
  author: string;
  isbn?: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [candidatos, setCandidatos] = useState<CoverCandidate[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState('');

  async function buscar() {
    if (!title.trim()) {
      setAviso('Escreva o título primeiro — é só com ele que dá para procurar.');
      return;
    }
    setBuscando(true);
    setAviso('Procurando capas...');
    setCandidatos([]);
    try {
      const achadas = await searchBookCovers(title, author, isbn);
      setCandidatos(achadas);
      if (!achadas.length) {
        setAviso('Nenhuma capa encontrada. Tente incluir o autor, ou use uma imagem da galeria.');
      } else {
        setAviso(achadas.length === 1 ? '1 capa encontrada. Toque para usar.' : achadas.length + ' capas encontradas. Toque na que quiser.');
      }
    } catch {
      setAviso('Não foi possível buscar agora. Verifique a conexão e tente de novo.');
    } finally {
      setBuscando(false);
    }
  }

  async function daGaleria() {
    const imagem = await pickImageAsDataUrl();
    if (!imagem) return;
    onChange(imagem);
    setCandidatos([]);
    setAviso('Imagem da galeria aplicada.');
  }

  function remover() {
    onChange('');
    setCandidatos([]);
    setAviso('Capa removida.');
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.previewBox}>
        {value ? (
          <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
        ) : (
          <>
            <ReadoraIcon name="camera" size={38} color={appColors.textDim} />
            <Text style={styles.previewText}>Sem capa</Text>
          </>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, buscando && styles.buttonDisabled]} onPress={buscar} disabled={buscando}>
          <ReadoraIcon name="search" size={16} color={appColors.background} />
          <Text style={styles.buttonText}>{buscando ? 'Procurando...' : 'Buscar capa'}</Text>
        </Pressable>
        <Pressable style={styles.outline} onPress={daGaleria}>
          <ReadoraIcon name="gallery" size={16} color={appColors.gold} />
          <Text style={styles.outlineText}>Galeria</Text>
        </Pressable>
        {value ? (
          <Pressable style={styles.remove} onPress={remover}>
            <ReadoraIcon name="trash" size={16} color={appColors.red} />
            <Text style={styles.removeText}>Remover</Text>
          </Pressable>
        ) : null}
      </View>

      {candidatos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {candidatos.map((capa) => {
            const escolhida = capa.url === value;
            return (
              <Pressable
                key={capa.url}
                style={styles.candidato}
                onPress={() => { onChange(capa.url); setAviso('Capa aplicada — de ' + capa.source + '.'); }}
              >
                <Image source={{ uri: capa.url }} style={StyleSheet.flatten([styles.candidatoImg, escolhida && styles.candidatoAtivo])} resizeMode="cover" />
                <Text style={styles.candidatoFonte} numberOfLines={1}>{capa.source}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Ou cole o endereço de uma imagem"
        placeholderTextColor={appColors.textDim}
        value={value.startsWith('data:') ? '' : value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  previewBox: { height: 190, borderRadius: 18, backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 8 },
  preview: { width: '100%', height: '100%' },
  previewText: { color: appColors.textDim, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: appColors.gold, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: appColors.background, fontWeight: '900' },
  outline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderColor: appColors.gold, borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  outlineText: { color: appColors.gold, fontWeight: '900' },
  remove: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderColor: appColors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  removeText: { color: appColors.red, fontWeight: '900' },
  strip: { gap: 10, paddingVertical: 2 },
  candidato: { width: 84, gap: 4 },
  candidatoAtivo: { borderColor: appColors.gold },
  candidatoImg: { width: 84, height: 124, borderRadius: 10, borderWidth: 2, borderColor: appColors.border, backgroundColor: appColors.surface },
  candidatoFonte: { color: appColors.textDim, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  aviso: { color: appColors.gold, fontWeight: '800', lineHeight: 20 },
  input: { backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: appColors.text, fontSize: 15 }
});
