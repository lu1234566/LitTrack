import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBooks } from '../context/BookContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Book, BookGenre, BookStatus, BookRatings } from '../types';
import { Save, X, Star, Heart, BookOpen, Search, Loader2, Camera, Barcode, ChevronDown, ChevronUp, Trash2, RefreshCw, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IsbnScanner } from '../components/IsbnScanner';
import { BookSearchModal } from '../components/BookSearchModal';
import { set } from 'idb-keyval';
import { CoverImage } from '../components/CoverImage';

const GENRES: BookGenre[] = ['Ficção', 'Não Ficção', 'Fantasia', 'Ficção Científica', 'Romance', 'Suspense', 'Terror', 'Biografia', 'História', 'Autoajuda', 'Outro'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const initialRatings: BookRatings = { historia: 0, personagens: 0, ritmo: 0, originalidade: 0, impactoEmocional: 0, final: 0 };

const SectionWrapper = ({ id, title, icon: Icon, children, colorClass = "text-amber-500", isMobileLayout, openSection, toggleSection }: any) => {
  const isOpen = !isMobileLayout || openSection === id;
  
  return (
    <div className={`bg-neutral-900/50 border border-neutral-800 rounded-3xl shadow-xl overflow-hidden ${isMobileLayout ? 'mb-4' : 'mb-8'}`}>
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center justify-between p-6 md:p-8 ${isMobileLayout ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <h2 className={`text-xl font-serif font-semibold ${colorClass} flex items-center gap-2`}>
          <Icon size={20} />
          {title}
        </h2>
        {isMobileLayout && (
          <div className="text-neutral-500">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isMobileLayout ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={isMobileLayout ? { height: 0, opacity: 0 } : undefined}
            className="px-6 pb-6 md:px-8 md:pb-8"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const BookForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addBook, updateBook, getBook } = useBooks();
  const { isMobileLayout } = useSettings();
  const [isFetching, setIsFetching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [manualIsbn, setManualIsbn] = useState('');

  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [manualCoverUrlInput, setManualCoverUrlInput] = useState('');

  // Accordion states for mobile
  const [openSection, setOpenSection] = useState<string | null>('import');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Formato inválido.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande.");
      return;
    }

    setIsUploading(true);

    try {
      const localId = `local_cover_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      await set(localId, file);
      
      setFormData(prev => ({
        ...prev,
        coverUrl: localId,
        coverSource: 'local'
      }));
      alert("Imagem carregada localmente com sucesso.");
    } catch (error) {
      console.error("Error saving local image:", error);
      alert("Não foi possível salvar a imagem localmente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlCoverSubmit = () => {
    if (!manualCoverUrlInput) return;
    
    if (!manualCoverUrlInput.startsWith('http')) {
      alert('A URL deve começar com http:// ou https://');
      return;
    }

    setFormData(prev => ({
      ...prev,
      coverUrl: manualCoverUrlInput,
      coverSource: 'url'
    }));
    setManualCoverUrlInput('');
    alert("Link da capa salvo com sucesso.");
  };

  const handleRemoveCover = () => {
    setFormData(prev => ({
      ...prev,
      coverUrl: '',
      coverSource: undefined
    }));
  };

  const toggleSection = (section: string) => {
    if (!isMobileLayout) return;
    setOpenSection(openSection === section ? null : section);
  };

  const isEditing = Boolean(id);
  const existingBook = id ? getBook(id) : undefined;

  const [formData, setFormData] = useState<Partial<Book>>({
    titulo: '',
    autor: '',
    mesLeitura: MONTHS[new Date().getMonth()],
    anoLeitura: 2026,
    genero: 'Ficção',
    status: 'lido',
    notaGeral: 0,
    resenha: '',
    pontosFortes: '',
    pontosFracos: '',
    citacaoFavorita: '',
    favorito: false,
    notasDetalhadas: initialRatings,
    coverUrl: '',
    pageCount: 0,
    description: '',
    isbn: '',
    publisher: '',
    publishedDate: '',
  });

  useEffect(() => {
    if (isEditing && existingBook) {
      setFormData(existingBook);
    }
  }, [isEditing, existingBook]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleRatingChange = (category: keyof BookRatings, value: number) => {
    setFormData((prev) => {
      const newRatings = { ...prev.notasDetalhadas!, [category]: value };
      const values = Object.values(newRatings) as number[];
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { ...prev, notasDetalhadas: newRatings, notaGeral: Number(avg.toFixed(1)) };
    });
  };

  const [isbnCache, setIsbnCache] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('isbn_cache');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('isbn_cache', JSON.stringify(isbnCache));
  }, [isbnCache]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cleanIsbn = manualIsbn.replace(/[- ]/g, '');
      if (cleanIsbn.length >= 10 && /^(?:\d{9}[\dXx]|\d{13})$/.test(cleanIsbn)) {
        if (!isbnCache[cleanIsbn]) {
          fetchBookByIsbn(cleanIsbn);
        } else {
          // Use cached data
          const data = isbnCache[cleanIsbn];
          setFormData(prev => ({ ...prev, ...data }));
        }
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [manualIsbn]);

  const mapCategoryToGenre = (categories: string[]): BookGenre => {
    if (!categories || categories.length === 0) return 'Ficção';
    
    const cat = categories[0].toLowerCase();
    if (cat.includes('fantasy') || cat.includes('fantasia')) return 'Fantasia';
    if (cat.includes('science fiction') || cat.includes('ficção científica') || cat.includes('sci-fi')) return 'Ficção Científica';
    if (cat.includes('romance') || cat.includes('amor')) return 'Romance';
    if (cat.includes('thriller') || cat.includes('suspense') || cat.includes('mystery')) return 'Suspense';
    if (cat.includes('horror') || cat.includes('terror')) return 'Terror';
    if (cat.includes('biography') || cat.includes('biografia') || cat.includes('autobiography')) return 'Biografia';
    if (cat.includes('history') || cat.includes('história')) return 'História';
    if (cat.includes('self-help') || cat.includes('autoajuda')) return 'Autoajuda';
    if (cat.includes('non-fiction') || cat.includes('não ficção')) return 'Não Ficção';
    
    return 'Ficção';
  };

  const fetchBookByIsbn = async (isbn: string) => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      // Try Google Books API first
      let googleBooksData = null;
      try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        if (response.ok) {
          googleBooksData = await response.json();
        }
      } catch (e) {
        console.warn("Google Books API failed, trying fallback", e);
      }

      if (googleBooksData && googleBooksData.items && googleBooksData.items.length > 0) {
        const volumeInfo = googleBooksData.items[0].volumeInfo;
        
        const bookData = {
          titulo: volumeInfo.title || '',
          autor: volumeInfo.authors ? volumeInfo.authors.join(', ') : '',
          description: volumeInfo.description || '',
          pageCount: volumeInfo.pageCount || 0,
          coverUrl: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
          coverSource: 'automatic' as const,
          isbn: isbn,
          publisher: volumeInfo.publisher || '',
          publishedDate: volumeInfo.publishedDate || '',
          genero: volumeInfo.categories ? mapCategoryToGenre(volumeInfo.categories) : 'Ficção',
        };

        setFormData(prev => ({ ...prev, ...bookData }));
        setIsbnCache(prev => ({ ...prev, [isbn]: bookData }));
        if (isMobileLayout) setOpenSection('basic');
        return;
      }

      // Fallback to Open Library
      const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (response.ok) {
        const data = await response.json();
        
        // Fetch author details if available (Open Library returns author keys)
        let authorName = '';
        if (data.authors && data.authors.length > 0) {
           try {
             const authorRes = await fetch(`https://openlibrary.org${data.authors[0].key}.json`);
             if (authorRes.ok) {
               const authorData = await authorRes.json();
               authorName = authorData.name;
             }
           } catch (e) {
             console.error("Error fetching author from Open Library", e);
           }
        }

        const bookData = {
          titulo: data.title,
          autor: authorName,
          description: data.description?.value || data.description || '',
          pageCount: data.number_of_pages || 0,
          coverUrl: data.covers && data.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : '',
          coverSource: 'automatic' as const,
          isbn: isbn,
          publisher: data.publishers ? data.publishers.join(', ') : '',
          publishedDate: data.publish_date || '',
          genero: data.subjects ? mapCategoryToGenre(data.subjects) : 'Ficção',
        };

        setFormData(prev => ({ ...prev, ...bookData }));
        setIsbnCache(prev => ({ ...prev, [isbn]: bookData }));
        if (isMobileLayout) setOpenSection('basic');
        return;
      }

      alert("Nenhum livro encontrado para este ISBN.");
    } catch (error) {
      console.error("Error fetching book by ISBN:", error);
      alert("Não foi possível buscar as informações agora. Tente novamente em instantes.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleScanIsbn = (isbn: string) => {
    setShowScanner(false);
    setManualIsbn(isbn);
    fetchBookByIsbn(isbn);
  };

  const handleManualIsbnSearch = () => {
    const cleanIsbn = manualIsbn.replace(/[- ]/g, '');
    if (!/^(?:\d{9}[\dXx]|\d{13})$/.test(cleanIsbn)) {
      alert("ISBN inválido. Verifique e tente novamente.");
      return;
    }
    
    if (isbnCache[cleanIsbn]) {
      setFormData(prev => ({ ...prev, ...isbnCache[cleanIsbn] }));
      if (isMobileLayout) setOpenSection('basic');
    } else {
      fetchBookByIsbn(cleanIsbn);
    }
  };

  const handleSelectBookFromSearch = (book: any) => {
    setFormData(prev => ({
      ...prev,
      titulo: book.title || prev.titulo,
      autor: book.authors ? book.authors.join(', ') : prev.autor,
      description: book.description || prev.description,
      pageCount: book.pageCount || prev.pageCount,
      coverUrl: book.thumbnail || prev.coverUrl,
      coverSource: book.thumbnail ? 'automatic' : prev.coverSource,
      isbn: book.isbn || prev.isbn,
      publisher: book.publisher || prev.publisher,
      publishedDate: book.publishedDate || prev.publishedDate,
    }));
    setShowSearchModal(false);
    if (isMobileLayout) setOpenSection('basic');
  };

  const sanitizeData = (data: Partial<Book>) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key as keyof Book] === undefined) {
        delete sanitized[key as keyof Book];
      }
    });
    // Remove fields that shouldn't be updated directly
    delete sanitized.id;
    delete sanitized.userId;
    delete sanitized.dataCadastro;
    // @ts-ignore
    delete sanitized.createdAt;
    return sanitized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanData = sanitizeData(formData);
      if (isEditing && id) {
        await updateBook(id, cleanData);
      } else {
        await addBook(cleanData as Omit<Book, 'id' | 'userId' | 'dataCadastro'>);
      }
      navigate('/livros');
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Erro ao salvar o livro. Tente novamente.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-24 md:pb-0">
      <header className="mb-6 md:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-neutral-100 tracking-tight">
            {isEditing ? 'Editar Livro' : 'Adicionar Leitura'}
          </h1>
          <p className="text-neutral-400 mt-1 md:mt-2 text-base md:text-lg">Registre os detalhes da sua jornada literária.</p>
        </div>
        {!isMobileLayout && (
          <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <X size={24} className="text-neutral-400" />
          </button>
        )}
      </header>

      <AnimatePresence>
        {showScanner && (
          <IsbnScanner 
            onScan={handleScanIsbn} 
            onClose={() => setShowScanner(false)} 
          />
        )}
        {showSearchModal && (
          <BookSearchModal
            initialQuery={formData.titulo || ''}
            onSelect={handleSelectBookFromSearch}
            onClose={() => setShowSearchModal(false)}
          />
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
        />
        {/* Importar dados do livro */}
        <SectionWrapper id="import" title="Importar dados do livro" icon={Barcode} isMobileLayout={isMobileLayout} openSection={openSection} toggleSection={toggleSection}>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-neutral-950 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20"
            >
              <Camera size={24} />
              Escanear ISBN
            </button>
            
            <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                <input
                  type="text"
                  placeholder="Digite o ISBN do livro"
                  value={manualIsbn}
                  onChange={(e) => setManualIsbn(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleManualIsbnSearch}
                disabled={isFetching || !manualIsbn}
                className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 px-6 py-4 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isFetching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                Buscar por ISBN
              </button>
            </div>
          </div>

          {/* Preview Card */}
          {formData.isbn && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 md:mt-8 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start"
            >
              <div className="flex flex-col items-center gap-3">
                {formData.coverUrl ? (
                  <div className="relative">
                    <CoverImage coverUrl={formData.coverUrl} coverSource={formData.coverSource} alt="Capa" className="w-24 h-36 object-cover rounded-lg shadow-md" />
                    {(formData.coverSource === 'manual' || formData.coverSource === 'url' || formData.coverSource === 'local') && (
                      <div className="absolute top-1 right-1 bg-amber-500 text-neutral-950 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        Manual
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-36 bg-neutral-900 rounded-lg flex flex-col items-center justify-center border border-neutral-800 border-dashed gap-2">
                    <BookOpen size={24} className="text-neutral-700" />
                    <span className="text-[10px] text-neutral-500 text-center px-1">Sem capa</span>
                  </div>
                )}
                
                <div className="w-full max-w-[120px]">
                  {formData.coverUrl ? (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 w-full"
                      >
                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Substituir local
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        disabled={isUploading}
                        className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 w-full"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 py-1.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 w-full text-center leading-tight border border-amber-500/20"
                      >
                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                        Imagem local
                      </button>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="w-full bg-neutral-800 rounded-full h-1 mt-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1 rounded-full transition-all w-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-serif font-bold text-neutral-100 mb-1">{formData.titulo || 'Título não encontrado'}</h3>
                <p className="text-neutral-400 font-serif italic mb-4">{formData.autor || 'Autor desconhecido'}</p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start text-sm text-neutral-500">
                  {formData.pageCount && <span><strong className="text-neutral-300">Páginas:</strong> {formData.pageCount}</span>}
                  {formData.publisher && <span><strong className="text-neutral-300">Editora:</strong> {formData.publisher}</span>}
                  {formData.publishedDate && <span><strong className="text-neutral-300">Ano:</strong> {formData.publishedDate.substring(0, 4)}</span>}
                </div>
              </div>
            </motion.div>
          )}
        </SectionWrapper>

        {/* Informações Básicas */}
        <SectionWrapper id="basic" title="Informações Básicas" icon={BookOpen} isMobileLayout={isMobileLayout} openSection={openSection} toggleSection={toggleSection}>
          <div className={isMobileLayout ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-neutral-400">Título</label>
              <div className="flex gap-2">
                <input required type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" placeholder="Ex: O Nome do Vento" />
                <button 
                  type="button" 
                  onClick={() => setShowSearchModal(true)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Search size={18} />
                  {!isMobileLayout && "Buscar Online"}
                </button>
              </div>
            </div>
            
            <div className="md:col-span-2 flex flex-col items-center mb-2 md:mb-4">
              <p className="text-sm font-medium text-neutral-400 mb-4 self-start">Capa do Livro</p>
              
              <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                {formData.coverUrl ? (
                  <div className="w-32 h-48 rounded-lg overflow-hidden border border-neutral-700 shadow-lg relative group">
                    <CoverImage coverUrl={formData.coverUrl} coverSource={formData.coverSource} alt="Capa do livro" className="w-full h-full object-cover" />
                    {(formData.coverSource === 'manual' || formData.coverSource === 'url' || formData.coverSource === 'local') && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-neutral-950 text-[10px] font-bold px-2 py-1 rounded-full">
                        Manual
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-48 bg-neutral-900 rounded-lg flex flex-col items-center justify-center border border-neutral-800 border-dashed gap-2">
                    <BookOpen size={32} className="text-neutral-700" />
                    <span className="text-xs text-neutral-500 text-center px-2">Nenhuma capa encontrada</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 w-full">
                  {formData.coverUrl ? (
                    <div className="flex gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Substituir local
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCover}
                        disabled={isUploading}
                        className="flex-1 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} />
                        Remover capa
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => setShowSearchModal(true)}
                        className="w-full text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2.5 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Search size={16} />
                        Tentar buscar novamente
                      </button>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="Colar URL da capa"
                            value={manualCoverUrlInput}
                            onChange={(e) => setManualCoverUrlInput(e.target.value)}
                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                          <button
                            type="button"
                            onClick={handleUrlCoverSubmit}
                            disabled={!manualCoverUrlInput}
                            className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            <LinkIcon size={14} />
                            Usar capa por link
                          </button>
                        </div>
                        <div className="relative flex items-center py-2">
                          <div className="flex-grow border-t border-neutral-800"></div>
                          <span className="flex-shrink-0 mx-4 text-neutral-600 text-xs uppercase font-medium">ou</span>
                          <div className="flex-grow border-t border-neutral-800"></div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 py-2.5 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-amber-500/20"
                        >
                          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                          Usar imagem local neste dispositivo
                        </button>
                        <p className="text-[10px] text-neutral-500 text-center mt-1">
                          Essa imagem ficará disponível apenas neste dispositivo.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full transition-all w-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Autor</label>
              <input required type="text" name="autor" value={formData.autor} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" placeholder="Ex: Patrick Rothfuss" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Número de Páginas</label>
              <input type="number" name="pageCount" value={formData.pageCount || ''} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" placeholder="Ex: 656" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-neutral-400">Sinopse / Descrição</label>
              <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none" placeholder="Descrição do livro..."></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Gênero</label>
              <select name="genero" value={formData.genero} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none">
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none">
                <option value="lido">Lido</option>
                <option value="lendo">Lendo</option>
                <option value="quero ler">Quero Ler</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Mês da Leitura</label>
              <select name="mesLeitura" value={formData.mesLeitura} onChange={handleChange} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none">
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2 flex items-center mt-4 md:mt-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" name="favorito" checked={formData.favorito} onChange={handleChange} className="sr-only" />
                  <div className={`w-8 h-8 md:w-6 md:h-6 rounded border flex items-center justify-center transition-colors ${formData.favorito ? 'bg-rose-500 border-rose-500' : 'border-neutral-700 group-hover:border-neutral-500'}`}>
                    {formData.favorito && <Heart size={16} className="text-white fill-white" />}
                  </div>
                </div>
                <span className="text-base md:text-sm font-medium text-neutral-300 group-hover:text-neutral-100 transition-colors">Marcar como Favorito</span>
              </label>
            </div>
          </div>
        </SectionWrapper>

        {/* Avaliação Detalhada */}
        <SectionWrapper id="quality" title="Controle de Qualidade" icon={Star} isMobileLayout={isMobileLayout} openSection={openSection} toggleSection={toggleSection}>
          <div className="flex items-center justify-between mb-6">
            <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl font-bold text-lg flex items-center gap-2">
              Média: {formData.notaGeral?.toFixed(1)} <Star size={18} fill="currentColor" />
            </div>
          </div>
          
          <div className={isMobileLayout ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"}>
            {Object.entries(formData.notasDetalhadas || initialRatings).map(([key, value]) => (
              <div key={key} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-neutral-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <span className="text-amber-500 font-bold">{value}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={value}
                  onChange={(e) => handleRatingChange(key as keyof BookRatings, Number(e.target.value))}
                  className={`w-full ${isMobileLayout ? 'h-4' : 'h-2'} bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500`}
                />
              </div>
            ))}
          </div>
        </SectionWrapper>

        {/* Resenha e Anotações */}
        <SectionWrapper id="diary" title="Diário de Leitura" icon={BookOpen} isMobileLayout={isMobileLayout} openSection={openSection} toggleSection={toggleSection}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Resenha Completa</label>
              <textarea name="resenha" value={formData.resenha} onChange={handleChange} rows={6} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none" placeholder="O que você achou da leitura? Quais foram as emoções?"></textarea>
            </div>
            
            <div className={isMobileLayout ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-500">Pontos Fortes</label>
                <textarea name="pontosFortes" value={formData.pontosFortes} onChange={handleChange} rows={3} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none" placeholder="O que o livro fez de melhor?"></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-rose-500">Pontos Fracos</label>
                <textarea name="pontosFracos" value={formData.pontosFracos} onChange={handleChange} rows={3} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all resize-none" placeholder="O que poderia ser melhor?"></textarea>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-amber-500">Citação Favorita</label>
              <textarea name="citacaoFavorita" value={formData.citacaoFavorita || ''} onChange={handleChange} rows={3} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none" placeholder="Uma frase ou trecho marcante do livro..."></textarea>
            </div>
          </div>
        </SectionWrapper>

        {isMobileLayout ? (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 z-40">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <button type="button" onClick={() => navigate(-1)} className="px-4 py-4 rounded-xl font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800 transition-colors flex-1 text-center">
                Cancelar
              </button>
              <button type="submit" disabled={isUploading} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 px-4 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 flex-[2]">
                <Save size={20} />
                {isEditing ? 'Salvar' : 'Salvar Livro'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isUploading} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20">
              <Save size={20} />
              {isEditing ? 'Salvar Alterações' : 'Salvar Livro'}
            </button>
          </div>
        )}
      </form>
    </motion.div>
  );
};
