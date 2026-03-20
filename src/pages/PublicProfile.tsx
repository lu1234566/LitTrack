import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BookOpen, Star, Calendar, ArrowLeft, Loader2, ShieldAlert, UserPlus, UserMinus, Users } from 'lucide-react';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Book } from '../types';
import { CoverImage } from '../components/CoverImage';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';

export const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { following, followUser, unfollowUser, getFollowersCount, getFollowingCount } = useCommunity();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowingAction, setIsFollowingAction] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Check if current user is following this profile
  const isFollowing = currentUser && userId ? following.includes(userId) : false;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as UserProfile;
          if (!data.communityPublic) {
            setError('Este perfil é privado.');
            return;
          }
          setProfile(data);

          if (data.showBooksPublicly) {
            const booksRef = collection(db, 'books');
            const qBooks = query(
              booksRef,
              where('userId', '==', userId),
              where('status', '==', 'lido'),
              orderBy('dataCadastro', 'desc'),
              limit(5)
            );
            const booksSnap = await getDocs(qBooks);
            setRecentBooks(booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
          }

          // Fetch followers/following counts
          const followers = await getFollowersCount(userId);
          const following = await getFollowingCount(userId);
          setFollowersCount(followers);
          setFollowingCount(following);
        } else {
          setError('Perfil não encontrado.');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError('Erro ao carregar perfil.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, getFollowersCount, getFollowingCount]);

  const handleFollowToggle = async () => {
    if (!userId || isFollowingAction) return;
    setIsFollowingAction(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await followUser(userId);
        setFollowersCount(prev => prev + 1);
      }
    } finally {
      setIsFollowingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-4">
        <ShieldAlert size={64} className="mx-auto text-neutral-600" />
        <h2 className="text-2xl font-serif font-bold text-neutral-300">{error || 'Perfil não encontrado'}</h2>
        <Link to="/comunidade" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors">
          <ArrowLeft size={16} /> Voltar para a Comunidade
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link to="/comunidade" className="inline-flex items-center gap-2 text-neutral-400 hover:text-amber-500 transition-colors mb-4">
        <ArrowLeft size={16} /> Voltar
      </Link>

      {/* Profile Header */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-500/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <img 
            src={profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&size=128`} 
            alt={profile.displayName} 
            className="w-32 h-32 rounded-full border-4 border-neutral-900 shadow-2xl"
          />
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-serif font-bold text-neutral-100">{profile.displayName}</h1>
              {currentUser && currentUser.userId !== userId && (
                <button
                  onClick={handleFollowToggle}
                  disabled={isFollowingAction}
                  className={`px-6 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    isFollowing 
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                      : 'bg-amber-500 text-neutral-950 hover:bg-amber-600'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus size={18} />
                      Deixar de Seguir
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Seguir
                    </>
                  )}
                </button>
              )}
            </div>
            
            {profile.bio && (
              <p className="text-neutral-400 max-w-2xl leading-relaxed">{profile.bio}</p>
            )}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-4">
              <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 border border-neutral-700">
                <Users size={14} className="text-amber-500" /> {followersCount} seguidores
              </span>
              <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 border border-neutral-700">
                <Users size={14} className="text-amber-500" /> {followingCount} seguindo
              </span>
              {profile.favoriteGenre && (
                <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 border border-neutral-700">
                  <Star size={14} className="text-amber-500" /> {profile.favoriteGenre}
                </span>
              )}
              {profile.readingStreak && profile.readingStreak > 0 ? (
                <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm flex items-center gap-1.5 border border-amber-500/20 font-medium">
                  🔥 {profile.readingStreak} dias seguidos
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {profile.showStatsPublicly && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <BookOpen size={24} className="text-amber-500 mb-2" />
            <span className="text-3xl font-bold text-neutral-100">{profile.booksRead || 0}</span>
            <span className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Livros Lidos</span>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <User size={24} className="text-emerald-500 mb-2" />
            <span className="text-3xl font-bold text-neutral-100">{profile.pagesRead || 0}</span>
            <span className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Páginas Lidas</span>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <Star size={24} className="text-blue-500 mb-2" />
            <span className="text-3xl font-bold text-neutral-100">{profile.averageRating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Nota Média</span>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
            <Calendar size={24} className="text-purple-500 mb-2" />
            <span className="text-3xl font-bold text-neutral-100">
              {profile.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear()}
            </span>
            <span className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Membro Desde</span>
          </div>
        </div>
      )}

      {/* Recent Books */}
      {profile.showBooksPublicly && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-serif font-semibold text-amber-500 mb-6 flex items-center gap-2">
            <BookOpen size={24} />
            Últimas Leituras
          </h2>
          
          {recentBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {recentBooks.map((book) => (
                <div key={book.id} className="flex flex-col gap-2 group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border border-neutral-800 shadow-md relative">
                    <CoverImage 
                      coverUrl={book.coverUrl} 
                      coverSource={book.coverSource} 
                      fallbackUrl={book.ilustracaoUrl} 
                      alt={book.titulo} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star size={14} className="fill-amber-500" />
                        {book.notaGeral ? book.notaGeral.toFixed(1) : '0.0'}
                      </div>
                    </div>
                  </div>
                  <div className="px-1">
                    <h3 className="text-sm font-medium text-neutral-200 truncate group-hover:text-amber-500 transition-colors">{book.titulo}</h3>
                    <p className="text-xs text-neutral-500 truncate">{book.autor}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500 bg-neutral-950 rounded-2xl border border-neutral-800 border-dashed">
              Nenhum livro lido recentemente.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
