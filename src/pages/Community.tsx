import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Activity, Star, BookOpen, Award, ChevronRight, MessageSquare, PlusCircle, Edit3, X, Target, Globe, Lock, Settings, Share2, Copy, Check } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, CommunityMember } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { useCommunity } from '../context/CommunityContext';
import { FeedItem } from '../components/FeedItem';
import { Challenges } from '../components/Challenges';
import { Badges } from '../components/Badges';
import { CreateCommunityModal } from '../components/CreateCommunityModal';
import { JoinCommunityModal } from '../components/JoinCommunityModal';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { ClubSharedRead } from '../components/ClubSharedRead';

export const Community: React.FC = () => {
  const { feed, createPost, activeCommunity, setActiveCommunity, 
    getCommunityMembers, 
    regenerateInviteCode, 
    leaveCommunity,
    updateSharedBook,
    updateMemberProgress,
    removeMember
  } = useCommunity();
  const [searchParams, setSearchParams] = useSearchParams();
  const [topReaders, setTopReaders] = useState<UserProfile[]>([]);
  const [highlights, setHighlights] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'badges' | 'members' | 'shared_read'>('feed');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialInviteCode, setInitialInviteCode] = useState('');
  const { user } = useAuth();
  const { books } = useBooks();

  // Sync progress if shared read is active
  useEffect(() => {
    if (activeCommunity?.sharedBook && user) {
      const match = books.find(b => 
        b.titulo.toLowerCase() === activeCommunity.sharedBook!.title.toLowerCase() &&
        b.autor.toLowerCase() === activeCommunity.sharedBook!.author.toLowerCase()
      );
      
      if (match) {
        const myMembership = communityMembers.find(m => m.userId === user.userId);
        if (myMembership && (
           myMembership.sharedBookProgress !== (match.progressPercentage || 0) || 
           myMembership.sharedBookFinished !== (match.status === 'lido')
        )) {
          updateMemberProgress(
            activeCommunity.id, 
            match.progressPercentage || 0, 
            match.status === 'lido'
          );
        }
      }
    }
  }, [activeCommunity, user, books, communityMembers, updateMemberProgress]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInitialInviteCode(code);
      setIsJoinModalOpen(true);
      // Remove code from URL to avoid re-opening on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('code');
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchCommunityData = async () => {
      if (activeCommunity) {
        const members = await getCommunityMembers(activeCommunity.id);
        setCommunityMembers(members);
        setIsLoading(false);
        return;
      }

      // Only show loading if we don't have top readers yet
      if (topReaders.length === 0) {
        setIsLoading(true);
      }
      
      try {
        // Fetch Top Readers (public profiles only)
        const usersRef = collection(db, 'users');
        const qUsers = query(usersRef, where('communityPublic', '==', true), limit(50));
        const usersSnap = await getDocs(qUsers);
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        // Sort client-side to avoid composite index requirement
        const sortedUsers = usersData.sort((a, b) => (b.booksRead || 0) - (a.booksRead || 0)).slice(0, 10);
        setTopReaders(sortedUsers);

        // Fetch Newest Member
        const newestData = usersData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];

        // Calculate Highlights
        const mostPagesData = usersData.sort((a, b) => (b.pagesRead || 0) - (a.pagesRead || 0))[0];
        const highestRatingData = usersData.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))[0];

        setHighlights({
          mostPages: mostPagesData,
          highestRating: highestRatingData,
          newest: newestData
        });
      } catch (error) {
        console.error("Error fetching community data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityData();
  }, [activeCommunity?.id, getCommunityMembers]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await createPost(newPostContent);
      setNewPostContent('');
      setIsCreatingPost(false);
      setActiveTab('feed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (!activeCommunity?.inviteCode) return;
    const link = `${window.location.origin}/comunidade?code=${activeCommunity.inviteCode}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!activeCommunity) return;
    await regenerateInviteCode(activeCommunity.id);
  };

  const handleLeave = async () => {
    if (!activeCommunity) return;
    if (window.confirm('Tem certeza que deseja sair desta comunidade?')) {
      await leaveCommunity(activeCommunity.id);
      setActiveCommunity(null);
    }
  };

  return (
    <motion.div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <>
          {activeCommunity ? (
            <header className="relative mb-8 rounded-[2.5rem] overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900">
               {/* Banner */}
               <div className="h-48 md:h-64 relative">
                 <img 
                   src={activeCommunity.bannerUrl || `https://picsum.photos/seed/${activeCommunity.id}/1200/400?blur=2`} 
                   className="w-full h-full object-cover opacity-50 transition-all hover:opacity-70"
                   alt="Community Banner"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
               </div>
               
               {/* Info Overlay */}
               <div className="p-8 -mt-20 relative flex flex-col md:flex-row md:items-end gap-6">
                 <img 
                   src={activeCommunity.imageUrl} 
                   alt={activeCommunity.name} 
                   className="w-32 h-32 rounded-3xl object-cover border-4 border-neutral-900 shadow-2xl z-10" 
                 />
                 <div className="flex-1 pb-2">
                   <div className="flex items-center gap-3 mb-2">
                     <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight">
                       {activeCommunity.name}
                     </h1>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                       activeCommunity.visibility === 'private' ? 'bg-amber-500/10 text-amber-500' : 'bg-neutral-800 text-neutral-400'
                     }`}>
                       {activeCommunity.visibility === 'private' ? 'Clube Privado' : 'Comunidade Pública'}
                     </span>
                   </div>
                   <p className="text-neutral-300 text-lg max-w-2xl">{activeCommunity.description}</p>
                 </div>
                 
                 <div className="flex items-center gap-3 pb-2">
                    {activeCommunity && (
                      <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="p-3 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-500 rounded-xl transition-colors shadow-xl"
                      >
                        <Settings size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => setIsCreatingPost(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-amber-500/20 whitespace-nowrap"
                    >
                      <Edit3 size={20} />
                      Nova Publicação
                    </button>
                 </div>
               </div>
            </header>
          ) : (
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-serif font-bold text-neutral-100 tracking-tight flex items-center gap-3">
                  <Users size={36} className="text-amber-500" />
                  Comunidade
                </h1>
                <p className="text-neutral-400 mt-2 text-lg">
                  Conecte-se com outros leitores e acompanhe o progresso do clube.
                </p>
              </div>
            </header>
          )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sidebar & Navigation */}
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
          <CommunitySidebar 
            onCreateClick={() => setIsCreateModalOpen(true)} 
            onJoinClick={() => setIsJoinModalOpen(true)} 
          />

          {activeCommunity && activeCommunity.sharedBook && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3">
                <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl">
                  <BookOpen size={16} />
                </div>
              </div>
              
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Livro do Mês</h3>
              
              <div className="flex gap-4 mb-4">
                <img 
                  src={activeCommunity.sharedBook.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeCommunity.sharedBook.title)}&background=222`} 
                  alt={activeCommunity.sharedBook.title}
                  className="w-16 h-24 object-cover rounded-lg shadow-2xl transition-transform group-hover:scale-105"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-neutral-100 truncate group-hover:text-amber-500 transition-colors">{activeCommunity.sharedBook.title}</h4>
                  <p className="text-xs text-neutral-400 italic truncate mb-3">{activeCommunity.sharedBook.author}</p>
                  
                  {user && communityMembers.find(m => m.userId === user.userId) && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-neutral-500 uppercase">Seu Progresso</span>
                        <span className="text-amber-500">
                          {communityMembers.find(m => m.userId === user.userId)?.sharedBookProgress || 0}%
                        </span>
                      </div>
                      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500" 
                          style={{ width: `${communityMembers.find(m => m.userId === user.userId)?.sharedBookProgress || 0}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('shared_read')}
                className="w-full py-2.5 bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 text-xs font-bold text-neutral-300 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Detalhes da Leitura
                <ChevronRight size={14} />
              </button>
            </motion.section>
          )}

          {!activeCommunity && (
            <>
              {/* Top Leitores */}
              <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif font-semibold text-amber-500 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Top Leitores
                  </h2>
                </div>

                <div className="space-y-4">
                  {topReaders.length > 0 ? topReaders.map((reader, index) => (
                    <Link key={reader.id} to={`/perfil/${reader.id}`} className="block">
                      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 flex items-center gap-3 hover:border-amber-500/30 transition-colors group">
                        <div className="relative">
                          <img src={reader.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(reader.displayName)}&background=random`} alt={reader.displayName} className="w-10 h-10 rounded-full border-2 border-neutral-800 group-hover:border-amber-500 transition-colors" />
                          <div className="absolute -bottom-1 -right-1 bg-neutral-900 border border-neutral-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-500">
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-neutral-200 truncate group-hover:text-amber-500 transition-colors">{reader.displayName}</h3>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-500">
                            <span className="flex items-center gap-1"><BookOpen size={12} /> {reader.booksRead || 0}</span>
                            <span className="flex items-center gap-1"><Star size={12} className="text-amber-500/70" /> {reader.averageRating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div className="text-center py-8 text-neutral-500">Nenhum leitor encontrado ainda.</div>
                  )}
                </div>
              </section>

              {/* Destaques da Comunidade */}
              <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                <h2 className="text-xl font-serif font-semibold text-amber-500 flex items-center gap-2 mb-6">
                  <Star size={20} />
                  Destaques
                </h2>
                
                <div className="space-y-4">
                  {highlights.mostPages && (
                    <Link to={`/perfil/${highlights.mostPages.id}`} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-amber-500/30 transition-colors group">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Mais Páginas</span>
                      <div className="flex items-center gap-3">
                        <img src={highlights.mostPages.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(highlights.mostPages.displayName)}`} className="w-8 h-8 rounded-full border border-neutral-800 group-hover:border-amber-500 transition-colors" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-200 truncate group-hover:text-amber-500 transition-colors">{highlights.mostPages.displayName}</p>
                          <p className="text-sm font-bold text-amber-500">{highlights.mostPages.pagesRead || 0} <span className="text-[10px] text-neutral-500 font-normal">páginas</span></p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {highlights.highestRating && (
                    <Link to={`/perfil/${highlights.highestRating.id}`} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-amber-500/30 transition-colors group">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Maior Nota Média</span>
                      <div className="flex items-center gap-3">
                        <img src={highlights.highestRating.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(highlights.highestRating.displayName)}`} className="w-8 h-8 rounded-full border border-neutral-800 group-hover:border-amber-500 transition-colors" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-200 truncate group-hover:text-amber-500 transition-colors">{highlights.highestRating.displayName}</p>
                          <p className="text-sm font-bold text-amber-500 flex items-center gap-1"><Star size={12} className="fill-amber-500" /> {highlights.highestRating.averageRating?.toFixed(1) || '0.0'}</p>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </section>
            </>
          )}

          {activeCommunity && isSettingsOpen && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6 overflow-hidden"
            >
              <h3 className="text-lg font-serif font-bold text-neutral-100 flex items-center gap-2">
                <Settings size={20} className="text-amber-500" />
                Configurações
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Código de Convite</label>
                  <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl p-2 pl-4">
                    <span className="font-mono font-bold text-amber-500 tracking-widest">{activeCommunity.inviteCode}</span>
                    <button 
                      onClick={copyInviteLink}
                      className="ml-auto p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-amber-500"
                    >
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleRegenerateCode}
                  className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Regerar Código
                </button>

                <div className="pt-4 border-t border-neutral-800">
                  <button 
                    onClick={handleLeave}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-bold transition-colors"
                  >
                    Sair da Comunidade
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </div>

        {/* Right Column: Main Content Area */}
        <div className="lg:col-span-9 space-y-8 order-1 lg:order-2">
          {/* Tabs */}
          <div className="flex space-x-1 bg-neutral-900/50 p-1 rounded-2xl border border-neutral-800 w-full md:w-fit">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'feed' ? 'bg-neutral-800 text-amber-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Activity size={18} />
              <span className="hidden sm:inline">Feed</span>
            </button>
            {activeCommunity && (
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'members' ? 'bg-neutral-800 text-amber-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Users size={18} />
                <span className="hidden sm:inline">Membros</span>
              </button>
            )}
            {activeCommunity && (
              <button
                onClick={() => setActiveTab('shared_read')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'shared_read' ? 'bg-neutral-800 text-amber-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <BookOpen size={18} />
                <span className="hidden sm:inline">Leitura Coletiva</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'challenges' ? 'bg-neutral-800 text-amber-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Target size={18} />
              <span className="hidden sm:inline">Desafios</span>
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'badges' ? 'bg-neutral-800 text-amber-500 shadow-sm' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Award size={18} />
              <span className="hidden sm:inline">Conquistas</span>
            </button>
          </div>

          {activeTab === 'shared_read' && activeCommunity && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <ClubSharedRead 
                community={activeCommunity} 
                members={communityMembers} 
                isOwner={activeCommunity.ownerId === user?.userId}
                onUpdateSharedBook={(sb) => updateSharedBook(activeCommunity.id, sb)}
              />
            </motion.div>
          )}

          {activeTab === 'feed' && (
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {activeCommunity && activeCommunity.sharedBook && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row gap-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16" />
                  
                  <div className="shrink-0">
                    <img 
                      src={activeCommunity.sharedBook.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeCommunity.sharedBook.title)}&background=222`} 
                      className="w-32 h-44 object-cover rounded-2xl shadow-xl border border-neutral-800 group-hover:scale-105 transition-transform"
                      alt="Current Read"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full mb-3 inline-block">
                        Leitura do Mês
                      </span>
                      <h3 className="text-2xl font-serif font-bold text-neutral-100">{activeCommunity.sharedBook.title}</h3>
                      <p className="text-neutral-400 font-serif italic">{activeCommunity.sharedBook.author}</p>
                    </div>
                    
                    {activeCommunity.sharedBook.discussionPrompt && (
                      <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50 italic text-sm text-neutral-300">
                        "{activeCommunity.sharedBook.discussionPrompt}"
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setActiveTab('shared_read')}
                      className="text-amber-500 text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      Acompanhar Progresso do Grupo <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 shadow-xl min-h-[400px]">
                <h2 className="text-2xl font-serif font-semibold text-amber-500 flex items-center gap-2 mb-6">
                  <Activity size={24} />
                  Atividade {activeCommunity ? 'da Comunidade' : 'Recente'}
                </h2>
                
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
                  {feed.length > 0 ? feed.map((item) => (
                    <FeedItem key={item.id} item={item} />
                  )) : (
                    <div className="text-center py-12 text-neutral-500 relative z-10 bg-neutral-900/50 rounded-xl border border-dashed border-neutral-800">
                      Nenhuma atividade recente nesta comunidade.
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'members' && activeCommunity && (
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {communityMembers.map((member) => (
                <Link key={member.id} to={`/perfil/${member.userId}`} className="block">
                  <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-all group">
                    <img src={member.userPhotoURL} alt={member.userDisplayName} className="w-12 h-12 rounded-xl object-cover border border-neutral-800 group-hover:border-amber-500 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-100 truncate group-hover:text-amber-500 transition-colors">{member.userDisplayName}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        member.role === 'owner' ? 'bg-amber-500/10 text-amber-500' : 
                        member.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 
                        'bg-neutral-800 text-neutral-400'
                      }`}>
                        {member.role === 'owner' ? 'Proprietário' : member.role === 'admin' ? 'Admin' : 'Membro'}
                      </span>
                    </div>
                    {activeCommunity.ownerId === user?.userId && member.userId !== user?.userId && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm(`Remover ${member.userDisplayName} da comunidade?`)) {
                            removeMember(activeCommunity.id, member.userId);
                            setCommunityMembers(prev => prev.filter(m => m.userId !== member.userId));
                          }
                        }}
                        className="p-2 text-neutral-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={18} />
                      </button>
                    )}
                    <ChevronRight size={20} className="text-neutral-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </motion.section>
          )}

          {activeTab === 'challenges' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Challenges />
            </motion.div>
          )}

          {activeTab === 'badges' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Badges />
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateCommunityModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <JoinCommunityModal 
        isOpen={isJoinModalOpen} 
        onClose={() => {
          setIsJoinModalOpen(false);
          setInitialInviteCode('');
        }} 
        initialCode={initialInviteCode}
      />

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreatingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-neutral-100">Nova Publicação</h2>
                <button 
                  onClick={() => setIsCreatingPost(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={activeCommunity ? `Postar em ${activeCommunity.name}...` : "O que você está lendo? Compartilhe seus pensamentos..."}
                  className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none"
                  autoFocus
                />
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={!newPostContent.trim() || isSubmitting}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};
