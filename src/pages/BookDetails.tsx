import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBooks } from '../context/BookContext';
import { Book, Edit, Trash2, Star, Heart, Image as ImageIcon, Loader2, ArrowLeft, Calendar, BookOpen, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { IllustrationStyle, ImageAspectRatio } from '../types';
import { CoverImage } from '../components/CoverImage';

export const BookDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBook, deleteBook, updateBook, loading } = useBooks();
  const book = getBook(id || '');

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<IllustrationStyle>('thriller cinematográfico');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<ImageAspectRatio>('3:4');

  const [isDeleting, setIsDeleting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin text-amber-500">
          <BookOpen size={48} />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-400">
        <BookOpen size={64} className="mb-4 text-neutral-700" />
        <h2 className="text-2xl font-serif font-bold text-neutral-200">Livro não encontrado</h2>
        <button onClick={() => navigate('/livros')} className="mt-6 text-amber-500 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar para a biblioteca
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteBook(book.id);
      navigate('/livros');
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Erro ao excluir o livro.");
    }
  };

  const handleGenerateIllustration = async () => {
    setIsGenerating(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI({});
      
      const prompt = `Ilustração conceitual original inspirada em um livro do gênero ${book.genero}.
      Atmosfera e emoção baseadas na resenha: "${book.resenha}".
      Estilo visual: ${selectedStyle}.
      Regras estritas: Não reproduzir capas existentes, não copiar personagens oficiais, sem texto, sem capa oficial. Composição elegante focada no clima, ritmo e tom da leitura.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: selectedAspectRatio,
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        // Compress image before saving to avoid Firestore 1MB limit
        const compressedImageUrl = await compressImage(imageUrl);
        await updateBook(book.id, { ilustracaoUrl: compressedImageUrl, estiloIlustracao: selectedStyle, proporcaoIlustracao: selectedAspectRatio });
      } else {
        alert('Não foi possível gerar a imagem. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao gerar ilustração:', error);
      alert('Ocorreu um erro ao gerar a ilustração.');
    } finally {
      setIsGenerating(false);
    }
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use JPEG with 0.7 quality to significantly reduce size
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(base64Str); // Fallback to original if error
    });
  };

  const styles: IllustrationStyle[] = [
    'aquarela', 
    'fantasia sombria', 
    'thriller cinematográfico', 
    'minimalista', 
    'clássico editorial', 
    'dreamlike',
    'Dark Fantasy',
    'Vintage Book Illustration',
    'Minimalist Poster',
    'Surreal Dreamlike',
    'Anime Inspired',
    'Oil Painting',
    'Watercolor',
    'Noir Thriller'
  ];
  const aspectRatios: ImageAspectRatio[] = ['1:1', '3:4', '4:3', '9:16', '16:9'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-serif font-bold text-neutral-100 mb-2">Excluir Livro</h3>
            <p className="text-neutral-400 mb-6">Tem certeza que deseja excluir "{book.titulo}"? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 rounded-xl font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-400 hover:text-amber-500 transition-colors">
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Link to={`/editar/${book.id}`} className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-amber-500 hover:border-amber-500/50 rounded-xl transition-all">
            <Edit size={18} />
          </Link>
          <button onClick={() => setIsDeleting(true)} className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-rose-500 hover:border-rose-500/50 rounded-xl transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image & AI */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center group w-full p-6">
            {book.coverUrl ? (
              <div className="relative">
                <CoverImage coverUrl={book.coverUrl} coverSource={book.coverSource} alt={`Capa de ${book.titulo}`} className="w-48 h-auto object-cover rounded-lg shadow-lg" />
                {(book.coverSource === 'manual' || book.coverSource === 'url' || book.coverSource === 'local') && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-neutral-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                    Manual
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-72 bg-neutral-900 rounded-lg flex flex-col items-center justify-center border border-neutral-800 border-dashed gap-4 shadow-lg">
                <BookOpen size={48} className="text-neutral-700" />
                <span className="text-sm text-neutral-500 text-center px-4">Nenhuma capa disponível</span>
              </div>
            )}
            <p className="text-neutral-500 font-medium mt-4 text-sm uppercase tracking-wider">
              {(book.coverSource === 'manual' || book.coverSource === 'url' || book.coverSource === 'local') ? 'Capa Manual' : 'Capa Oficial'}
            </p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center group w-full">
            {book.ilustracaoUrl ? (
              <>
                <img src={book.ilustracaoUrl} alt={`Ilustração para ${book.titulo}`} className="w-full h-auto object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-sm text-neutral-300 font-medium">Estilo: <span className="capitalize text-amber-500">{book.estiloIlustracao}</span></p>
                </div>
              </>
            ) : (
              <div className="text-center p-8 aspect-[3/4] flex flex-col items-center justify-center w-full">
                <ImageIcon size={64} className="mx-auto text-neutral-700 mb-4" />
                <p className="text-neutral-500 font-medium">Nenhuma ilustração gerada ainda.</p>
              </div>
            )}
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-serif font-semibold text-amber-500 mb-4 flex items-center gap-2">
              <ImageIcon size={18} />
              Gerar Ilustração com IA
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Estilo Visual</label>
                <select 
                  value={selectedStyle} 
                  onChange={(e) => setSelectedStyle(e.target.value as IllustrationStyle)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none capitalize"
                >
                  {styles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Proporção</label>
                <select 
                  value={selectedAspectRatio} 
                  onChange={(e) => setSelectedAspectRatio(e.target.value as ImageAspectRatio)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none"
                >
                  {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                </select>
              </div>
              <button 
                onClick={handleGenerateIllustration} 
                disabled={isGenerating}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:shadow-none"
              >
                {isGenerating ? (
                  <><Loader2 size={18} className="animate-spin" /> Gerando Arte...</>
                ) : (
                  <><ImageIcon size={18} /> Gerar Nova Arte</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-xs font-medium uppercase tracking-wider">{book.genero}</span>
              {book.favorito && <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Heart size={12} fill="currentColor" /> Favorito</span>}
            </div>
            <h1 className="text-5xl font-serif font-bold text-neutral-100 leading-tight mb-2">{book.titulo}</h1>
            <p className="text-2xl text-neutral-400 font-serif italic">{book.autor}</p>
          </div>

          <div className="flex flex-wrap gap-6 py-6 border-y border-neutral-800/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Star size={24} fill="currentColor" /></div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Nota Geral</p>
                <p className="text-2xl font-bold text-neutral-100">{book.notaGeral.toFixed(1)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Calendar size={24} /></div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Lido em</p>
                <p className="text-xl font-bold text-neutral-100">{book.mesLeitura} {book.anoLeitura}</p>
              </div>
            </div>
            {book.pageCount && (
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><BookOpen size={24} /></div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Páginas</p>
                  <p className="text-xl font-bold text-neutral-100">{book.pageCount}</p>
                </div>
              </div>
            )}
          </div>

          {book.description && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-serif font-semibold text-amber-500 mb-4">Sinopse</h3>
              <p className="text-neutral-300 leading-relaxed text-sm">
                {book.description}
              </p>
            </div>
          )}

          {book.resenha && (
            <div className="relative">
              <Quote className="absolute -top-4 -left-4 text-neutral-800/50 rotate-180" size={48} />
              <p className="text-lg text-neutral-300 leading-relaxed relative z-10 pl-4 border-l-2 border-amber-500/30">
                {book.resenha}
              </p>
            </div>
          )}

          {book.citacaoFavorita && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={64} className="text-amber-500" />
              </div>
              <h4 className="text-amber-500 font-bold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                <Quote size={14} />
                Citação Favorita
              </h4>
              <p className="text-xl font-serif italic text-neutral-200 leading-relaxed relative z-10">
                "{book.citacaoFavorita}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {book.pontosFortes && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
                <h4 className="text-emerald-500 font-bold mb-2 uppercase tracking-wider text-xs">Pontos Fortes</h4>
                <p className="text-neutral-300 text-sm leading-relaxed">{book.pontosFortes}</p>
              </div>
            )}
            {book.pontosFracos && (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6">
                <h4 className="text-rose-500 font-bold mb-2 uppercase tracking-wider text-xs">Pontos Fracos</h4>
                <p className="text-neutral-300 text-sm leading-relaxed">{book.pontosFracos}</p>
              </div>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-serif font-semibold text-amber-500 mb-6">Análise Detalhada</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {Object.entries(book.notasDetalhadas).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-neutral-200 font-bold">{value as number}/10</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${((value as number) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
