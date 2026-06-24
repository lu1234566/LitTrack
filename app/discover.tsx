import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { useBooks } from '@/contexts/BookContext';
import { searchGoogleBooks } from '@/services/externalBookSearch';
import { ExternalBook } from '@/types/externalBook';
import { appColors } from '@/theme/tokens';

const instantResults: ExternalBook[] = [
  {
    id: 'instant-eragon',
    title: 'Eragon',
    author: 'Christopher Paolini',
    genre: 'Fantasia',
    publisher: 'Rocco',
    publishedDate: '2003',
    totalPages: 468,
    isbn: '9788532518485',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780375826689-L.jpg',
    description: 'Um jovem encontra uma pedra azul que revela ser um ovo de dragao, iniciando uma jornada em Alagaesia.',
    source: 'open-library'
  },
  {
    id: 'instant-brisingr',
    title: 'Brisingr',
    author: 'Christopher Paolini',
    genre: 'Fantasia',
    publisher: 'Rocco',
    publishedDate: '2008',
    totalPages: 748,
    isbn: '9780375826726',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780375826726-L.jpg',
    description: 'A saga de Eragon continua em meio a aliancas, conflitos e descobertas sobre os Cavaleiros de Dragao.',
    source: 'open-library'
  }
];

export default function DiscoverScreen() {
  const { addBook } = useBooks();
  const [query, setQuery] = useState('Eragon');
  const [results, setResults] = useState<ExternalBook[]>(instantResults);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Resultados iniciais prontos para teste. Clique em Buscar para tentar APIs externas.');

  async function search() {
    setLoading(true);
    setMessage('Buscando em Google Books e Open Library...');
    try {
      const books = await searchGoogleBooks(query);
      setResults(books);
      setMessage(books.length ? books.length + ' resultado(s) encontrados. A busca usa Google Books, Open Library e fallback local.' : 'Nenhum resultado encontrado.');
    } catch {
      setResults(instantResults);
      setMessage('Busca externa indisponivel. Mostrando resultados locais para teste.');
    } finally {
      setLoading(false);
    }
  }

  async function importBook(book: ExternalBook) {
    await addBook({
      title: book.title,
      author: book.author,
      genre: book.genre,
      status: 'wishlist',
      rating: 0,
      totalPages: book.totalPages || 0,
      currentPage: 0,
      review: '',
      favoriteQuote: '',
      publisher: book.publisher || '',
      publishedDate: book.publishedDate || '',
      isbn: book.isbn || '',
      coverUrl: book.coverUrl || '',
      priority: 'media',
      reasonToRead: book.description ? book.description.slice(0, 220) : 'Importado da busca externa.',
      mood: '',
      notes: book.source
    });
    setMessage('Livro importado para Quero ler: ' + book.title);
  }

  return (
    <Screen>
      <Text style={styles.title}>Descobrir livros</Text>
      <Text style={styles.subtitle}>Busque e importe capa, autor, editora, ano, paginas e ISBN. Se a API externa falhar, o app usa fallback para teste.</Text>
      <View style={styles.searchRow}>
        <TextInput style={styles.input} placeholder="Titulo, autor ou ISBN" placeholderTextColor={appColors.textDim} value={query} onChangeText={setQuery} />
        <Pressable style={styles.button} onPress={search}><Text style={styles.buttonText}>{loading ? '...' : 'Buscar'}</Text></Pressable>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {results.map((book) => (
        <Card key={book.id}>
          <View style={styles.resultRow}>
            <View style={styles.coverBox}>
              {book.coverUrl ? <Image source={{ uri: book.coverUrl }} style={styles.coverImage} /> : <Text style={styles.coverText}>{book.title.slice(0, 1)}</Text>}
            </View>
            <View style={styles.info}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.meta}>{book.author}</Text>
              <Text style={styles.meta}>{book.publisher || 'Editora desconhecida'} • {book.publishedDate || 'sem ano'}</Text>
              <Text style={styles.meta}>{book.totalPages || 0} paginas • {book.genre}</Text>
              <Text style={styles.source}>{book.source}</Text>
            </View>
          </View>
          {book.description ? <Text style={styles.description} numberOfLines={3}>{book.description}</Text> : null}
          <Pressable style={styles.importButton} onPress={() => importBook(book)}><Text style={styles.importText}>Importar para Quero ler</Text></Pressable>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: appColors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 15, lineHeight: 22 },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: appColors.text, fontSize: 16 },
  button: { backgroundColor: appColors.gold, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: appColors.background, fontWeight: '900' },
  message: { color: appColors.gold, fontWeight: '800' },
  resultRow: { flexDirection: 'row', gap: 12 },
  coverBox: { width: 72, height: 108, borderRadius: 14, backgroundColor: appColors.surfaceSoft, borderColor: appColors.border, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverImage: { width: '100%', height: '100%' },
  coverText: { color: appColors.gold, fontSize: 34, fontWeight: '900' },
  info: { flex: 1, gap: 4 },
  bookTitle: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  meta: { color: appColors.textMuted, fontSize: 13 },
  source: { color: appColors.gold, fontSize: 12, fontWeight: '900' },
  description: { color: appColors.textMuted, lineHeight: 20, marginTop: 12 },
  importButton: { backgroundColor: appColors.gold, borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  importText: { color: appColors.background, fontWeight: '900' }
});
