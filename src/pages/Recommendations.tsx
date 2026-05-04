import React, { useMemo, useState } from 'react';
import { useBooks } from '../context/BookContext';
import { analysisService } from '../services/analysisService';
import { Sparkles, Loader2, RefreshCw, TrendingUp, Brain, Filter, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logomark } from '../components/Logomark';
import { Book, BookGenre, BookRatings, Recommendation } from '../types';

const initialRatings: BookRatings = {
  historia: 0,
  personagens: 0,
  ritmo: 0,
  originalidade: 0,
  impactoEmocional: 0,
  final: 0,
};

const RECOMMENDATION_CATALOG: Recommendation[] = [
  {
    titulo: 'A Paciente Silenciosa',
    autor: 'Alex Michaelides',
    genero: 'Suspense',
    motivo: 'Thriller psicológico de leitura rápida, com mistério central forte e atmosfera tensa. Combina com leituras de Frieda McFadden e narrativas cheias de viradas.',
    compatibilidade: 97,
    clima: 'Tenso',
    tipoFinal: 'Reviravolta',
    impactoEmocional: 'Choque',
  },
  {
    titulo: 'A Empregada',
    autor: 'Freida McFadden',
    genero: 'Suspense',
    motivo: 'Indicação direta para quem gosta de capítulos curtos, tensão doméstica e segredos revelados aos poucos. É uma escolha segura para manter seu padrão de thrillers ágeis.',
    compatibilidade: 99,
    clima: 'Tenso',
    tipoFinal: 'Explosivo',
    impactoEmocional: 'Adrenalina',
  },
  {
    titulo: 'O Casal que Mora ao Lado',
    autor: 'Shari Lapena',
    genero: 'Suspense',
    motivo: 'Mistério doméstico com ritmo constante, suspeitas cruzadas e leitura fluida. Boa ponte entre suspense psicológico e investigação familiar.',
    compatibilidade: 92,
    clima: 'Misterioso',
    tipoFinal: 'Surpreendente',
    impactoEmocional: 'Inquietação',
  },
  {
    titulo: 'Bom Dia, Verônica',
    autor: 'Raphael Montes e Ilana Casoy',
    genero: 'Suspense',
    motivo: 'Suspense brasileiro sombrio, investigativo e mais pesado. É uma boa recomendação se você quiser manter tensão psicológica com um impacto mais brutal.',
    compatibilidade: 90,
    clima: 'Sombrio',
    tipoFinal: 'Intenso',
    impactoEmocional: 'Perturbação',
  },
  {
    titulo: 'O Nome do Vento',
    autor: 'Patrick Rothfuss',
    genero: 'Fantasia',
    motivo: 'Fantasia de formação com escrita envolvente, mundo amplo e protagonista marcante. Boa escolha para expandir a trilha aberta por Eragon e Eldest.',
    compatibilidade: 94,
    clima: 'Mágico',
    tipoFinal: 'Épico',
    impactoEmocional: 'Encantamento',
  },
  {
    titulo: 'Mistborn: O Império Final',
    autor: 'Brandon Sanderson',
    genero: 'Fantasia',
    motivo: 'Fantasia com sistema de magia muito forte, ação, política e viradas bem planejadas. Combina com leitores que gostam de universos estruturados.',
    compatibilidade: 93,
    clima: 'Mágico',
    tipoFinal: 'Grandioso',
    impactoEmocional: 'Empolgação',
  },
  {
    titulo: 'A Guerra dos Tronos',
    autor: 'George R. R. Martin',
    genero: 'Fantasia',
    motivo: 'Fantasia política, brutal e cheia de personagens ambíguos. Boa opção para sair da fantasia de aventura tradicional e entrar em algo mais estratégico.',
    compatibilidade: 86,
    clima: 'Sombrio',
    tipoFinal: 'Cruel',
    impactoEmocional: 'Tensão',
  },
  {
    titulo: 'Eu Sou a Lenda',
    autor: 'Richard Matheson',
    genero: 'Terror',
    motivo: 'Terror curto, melancólico e reflexivo, com solidão, ameaça constante e impacto psicológico. Funciona bem para alternar com thrillers.',
    compatibilidade: 84,
    clima: 'Sombrio',
    tipoFinal: 'Marcante',
    impactoEmocional: 'Melancolia',
  },
  {
    titulo: 'Battle Royale',
    autor: 'Koushun Takami',
    genero: 'Ficção',
    motivo: 'Narrativa violenta, estratégica e cheia de tensão entre personagens. Boa indicação se você gosta de jogos psicológicos, sobrevivência e escolhas extremas.',
    compatibilidade: 88,
    clima: 'Caótico',
    tipoFinal: 'Brutal',
    impactoEmocional: 'Impacto',
  },
  {
    titulo: 'A Revolução dos Bichos',
    autor: 'George Orwell',
    genero: 'Ficção',
    motivo: 'Leitura curta, simbólica e crítica. Recomendação boa para variar entre thrillers e fantasia sem perder densidade interpretativa.',
    compatibilidade: 78,
    clima: 'Reflexivo',
    tipoFinal: 'Amargo',
    impactoEmocional: 'Reflexão',
  },
  {
    titulo: 'Flores para Algernon',
    autor: 'Daniel Keyes',
    genero: 'Ficção Científica',
    motivo: 'Ficção científica emocional e introspectiva, com foco em transformação humana. Boa escolha se você quiser algo mais sensível e profundo.',
    compatibilidade: 82,
    clima: 'Emocional',
    tipoFinal: 'Doloroso',
    impactoEmocional: 'Comoção',
  },
  {
    titulo: 'O Problema dos Três Corpos',
    autor: 'Cixin Liu',
    genero: 'Ficção Científica',
    motivo: 'Ficção científica de grande escala, cerebral e cheia de ideias. Recomendação para quando quiser um desafio mais denso.',
    compatibilidade: 74,
    clima: 'Cerebral',
    tipoFinal: 'Expansivo',
    impactoEmocional: 'Assombro',
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function recommendationKey(titulo: string, autor: string) {
  return `${normalizeText(titulo)}::${normalizeText(autor)}`;
}

function toValidGenre(genero: string): BookGenre {
  return (['Ficção', 'Não Ficção', 'Fantasia', 'Ficção Científica', 'Romance', 'Suspense', 'Terror', 'Biografia', 'História', 'Autoajuda', 'Outro'].includes(genero)
    ? genero
    : 'Outro') as BookGenre;
}

function getBaseBookData(rec: Recommendation): Omit<Book, 'id' | 'userId' | 'dataCadastro'> {
  return {
    titulo: rec.titulo,
    autor: rec.autor,
    mesLeitura: new Date().toLocaleString('pt-BR', { month: 'long' }).replace(/^./, c => c.toUpperCase()),
    anoLeitura: new Date().getFullYear(),
    genero: toValidGenre(rec.genero),
    status: 'quero ler',
    notaGeral: 0,
    resenha: '',
    pontosFortes: '',
    pontosFracos: '',
    citacaoFavorita: '',
    favorito: false,
    notasDetalhadas: initialRatings,
    coverUrl: '',
    coverSource: 'placeholder',
    pageCount: 0,
    currentPage: 0,
    totalPages: 0,
    progressPercentage: 0,
    priority: rec.compatibilidade >= 90 ? 'high' : 'medium',
    reasonToRead: rec.motivo,
    discoveredFrom: 'Recomendações Readora',
    queueOrder: Date.now(),
    addedAt: Date.now(),
    description: `Recomendação Readora: ${rec.motivo}`,
    isbn: '',
    publisher: '',
    publishedDate: '',
    moods: [rec.clima],
  };
}

function generateActionableRecommendations(books: Book[]): Recommendation[] {
  const consumed = new Set(
    books.map((book) => recommendationKey(book.titulo, book.autor))
  );

  const finishedOrReading = books.filter((book) => book.status === 'lido' || book.status === 'lendo');
  const genreCounts = finishedOrReading.reduce((acc, book) => {
    acc[book.genero] = (acc[book.genero] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodCounts = finishedOrReading.reduce((acc, book) => {
    const moods = book.moods && book.moods.length > 0 ? book.moods : analysisService.inferMoods(book);
    moods.forEach((mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const favoriteGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).map(([genre]) => genre);
  const favoriteMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood]) => mood);

  const scored = RECOMMENDATION_CATALOG
    .filter((rec) => !consumed.has(recommendationKey(rec.titulo, rec.autor)))
    .map((rec) => {
      let score = rec.compatibilidade;
      if (favoriteGenres.includes(rec.genero)) score += 10;
      if (favoriteMoods.includes(rec.clima)) score += 8;
      if (books.some((book) => normalizeText(book.autor) === normalizeText(rec.autor))) score += 6;
      return { ...rec, compatibilidade: Math.min(99, score) };
    })
    .sort((a, b) => b.compatibilidade - a.compatibilidade);

  return scored.slice(0, 9);
}

export const Recommendations: React.FC = () => {
  const { books, recommendations, saveRecommendations, addBook, updateBook, loading } = useBooks();
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterGenre, setFilterGenre] = useState('todos');
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set());
  const [readTitles, setReadTitles] = useState<Set<string>>(new Set());

  const booksByKey = useMemo(() => {
    const map = new Map<string, Book>();
    books.forEach((book) => map.set(recommendationKey(book.titulo, book.autor), book));
    return map;
  }, [books]);

  const booksInLibrary = useMemo(() => new Set(booksByKey.keys()), [booksByKey]);

  const handleGenerateRecommendations = async () => {
    if (books.length < 3) {
      alert('Adicione pelo menos 3 livros para que possamos entender seu gosto.');
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const recs = generateActionableRecommendations(books);
      await saveRecommendations(recs);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Ocorreu um erro ao gerar suas recomendações.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToQueue = async (rec: Recommendation) => {
    const key = recommendationKey(rec.titulo, rec.autor);
    if (booksInLibrary.has(key) || addedTitles.has(key)) return;

    try {
      await addBook(getBaseBookData(rec));
      setAddedTitles((previous) => new Set(previous).add(key));
    } catch (error) {
      console.error('Error adding recommendation to queue:', error);
      alert('Não foi possível adicionar esta recomendação à sua fila.');
    }
  };

  const handleMarkAsRead = async (rec: Recommendation) => {
    const key = recommendationKey(rec.titulo, rec.autor);
    const existingBook = booksByKey.get(key);
    if (existingBook?.status === 'lido' || readTitles.has(key)) return;

    try {
      if (existingBook) {
        await updateBook(existingBook.id, {
          status: 'lido',
          progressPercentage: 100,
          currentPage: existingBook.totalPages || existingBook.pageCount || existingBook.currentPage || 0,
          finishedAt: Date.now(),
        });
      } else {
        await addBook({
          ...getBaseBookData(rec),
          status: 'lido',
          progressPercentage: 100,
          finishedAt: Date.now(),
          priority: undefined,
          queueOrder: undefined,
        });
      }
      setReadTitles((previous) => new Set(previous).add(key));
    } catch (error) {
      console.error('Error marking recommendation as read:', error);
      alert('Não foi possível marcar esta recomendação como lida.');
    }
  };

  const filteredRecs = recommendations.filter(rec =>
    filterGenre === 'todos' || rec.genero.toLowerCase().includes(filterGenre.toLowerCase())
  );

  const genres = Array.from(new Set(recommendations.map(r => r.genero))).filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 p-2 rounded-2xl shadow-xl shadow-amber-500/10 animate-pulse flex items-center justify-center">
          <Logomark />
        </div>
      </div>
    );
  }

  if (books.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="bg-neutral-900 p-6 rounded-full mb-6">
          <Sparkles size={64} className="text-neutral-700" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-neutral-200 mb-4">Recomendações Personalizadas</h2>
        <p className="text-neutral-500 leading-relaxed mb-8">
          Precisamos conhecer um pouco mais do seu gosto para recomendar livros. Adicione pelo menos 3 leituras para desbloquear o motor de recomendações.
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">Recomendações</h1>
          <p className="text-neutral-400 mt-2 text-lg">Sugestões reais para sua próxima leitura, com base no seu DNA literário.</p>
        </div>
        <button
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          {isGenerating ? (
            <><Loader2 size={18} className="animate-spin" /> Gerando...</>
          ) : (
            <><RefreshCw size={18} /> Gerar Novas Recomendações</>
          )}
        </button>
      </header>

      {recommendations.length > 0 && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-xl">
          <div className="flex items-center gap-4 flex-1">
            <Filter className="text-neutral-500 ml-2" size={20} />
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none min-w-[200px]"
            >
              <option value="todos">Todos os Gêneros</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            Use “Adicionar à fila” para salvar como “Quero ler” ou “Lido” para registrar como leitura concluída.
          </p>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
          <Brain size={48} className="mx-auto text-amber-500/30 mb-4" />
          <h3 className="text-xl font-serif font-medium text-neutral-300 mb-2">O que ler em seguida?</h3>
          <p className="text-neutral-500 mb-8 max-w-sm mx-auto">Analisaremos seus livros, gêneros mais lidos e atmosferas predominantes para sugerir obras concretas para sua fila.</p>
          <button
            onClick={handleGenerateRecommendations}
            disabled={isGenerating}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-8 py-3 rounded-xl font-bold transition-all"
          >
            Começar Análise
          </button>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500">
          Nenhuma recomendação encontrada para este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredRecs.map((rec, index) => {
              const key = recommendationKey(rec.titulo, rec.autor);
              const existingBook = booksByKey.get(key);
              const alreadyAdded = Boolean(existingBook) || addedTitles.has(key);
              const alreadyRead = existingBook?.status === 'lido' || readTitles.has(key);

              return (
                <motion.div
                  key={rec.titulo}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col hover:border-amber-500/30 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-wider">{rec.genero}</span>
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm">
                      <TrendingUp size={14} />
                      {rec.compatibilidade}%
                    </div>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-neutral-100 mb-1 group-hover:text-amber-500 transition-colors">{rec.titulo}</h3>
                  <p className="text-neutral-400 font-serif italic mb-4">{rec.autor}</p>

                  <div className="bg-neutral-950/50 rounded-2xl p-4 mb-6 flex-1">
                    <p className="text-sm text-neutral-300 leading-relaxed italic">“{rec.motivo}”</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-neutral-800/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 uppercase font-medium tracking-wider">Clima</span>
                      <span className="text-neutral-200 font-bold">{rec.clima}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 uppercase font-medium tracking-wider">Tipo de Final</span>
                      <span className="text-neutral-200 font-bold">{rec.tipoFinal}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 uppercase font-medium tracking-wider">Impacto</span>
                      <span className="text-neutral-200 font-bold">{rec.impactoEmocional}</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddToQueue(rec)}
                      disabled={alreadyAdded}
                      className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 px-4 py-3 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {alreadyAdded ? (
                        <><CheckCircle2 size={18} /> Na biblioteca</>
                      ) : (
                        <><Plus size={18} /> Adicionar à fila</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(rec)}
                      disabled={alreadyRead}
                      className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 px-4 py-3 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> {alreadyRead ? 'Lido' : 'Marcar lido'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
