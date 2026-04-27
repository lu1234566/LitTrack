import React, { useState, useEffect, useMemo } from 'react';
import { CommunityFeedItem, Comment, Like } from '../types';
import { useCommunity } from '../context/CommunityContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, Star, Award, TrendingUp, Activity, MessageSquare, Heart, Send, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ReactionPicker, REACTION_TYPES } from './ReactionPicker';

interface FeedItemProps {
  item: CommunityFeedItem;
}

export const FeedItem: React.FC<FeedItemProps> = ({ item }) => {
  const { user } = useAuth();
  const { likePost, unlikePost, addComment, getComments, getLikes } = useCommunity();
  const [likes, setLikes] = useState<Like[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const fetchInteractions = async () => {
      const fetchedLikes = await getLikes(item.id);
      const fetchedComments = await getComments(item.id);
      setLikes(fetchedLikes);
      setComments(fetchedComments);
    };
    fetchInteractions();
  }, [item.id, getLikes, getComments]);

  const userReaction = user ? likes.find(l => l.userId === user.userId) : null;
  const hasReacted = !!userReaction;

  const aggregatedReactions = useMemo(() => {
    const counts: Record<string, { emoji: string; count: number; type: string }> = {};
    likes.forEach(like => {
      const reactionDef = REACTION_TYPES.find(r => r.type === like.reactionType);
      if (reactionDef) {
        if (!counts[like.reactionType]) {
          counts[like.reactionType] = { emoji: reactionDef.emoji, count: 0, type: reactionDef.type };
        }
        counts[like.reactionType].count += 1;
      }
    });
    return Object.values(counts);
  }, [likes]);

  const handleToggleReaction = async (reactionType: string) => {
    if (!user || isLiking) return;
    setIsLiking(true);
    try {
      if (userReaction?.reactionType === reactionType) {
        await unlikePost(item.id);
        setLikes(likes.filter(l => l.userId !== user.userId));
      } else {
        await likePost(item.id, reactionType);
        const newLike: Like = { 
          id: 'temp-' + Date.now(), 
          feedItemId: item.id, 
          userId: user.userId, 
          reactionType,
          createdAt: Date.now() 
        };
        setLikes(prev => [
          ...prev.filter(l => l.userId !== user.userId),
          newLike
        ]);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    const content = newComment.trim();
    setNewComment('');
    
    await addComment(item.id, content);
    const fetchedComments = await getComments(item.id);
    setComments(fetchedComments);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'finished_book': return <BookOpen size={16} className="text-emerald-500" />;
      case 'added_book': return <PlusCircle size={16} className="text-blue-500" />;
      case 'rated_book': return <Star size={16} className="text-amber-500" />;
      case 'milestone': return <Award size={16} className="text-purple-500" />;
      case 'leaderboard': return <TrendingUp size={16} className="text-rose-500" />;
      case 'manual': return <MessageSquare size={16} className="text-indigo-500" />;
      case 'challenge_completed': return <Award size={16} className="text-amber-500" />;
      case 'badge_earned': return <Award size={16} className="text-amber-500" />;
      case 'shared_book_updated': return <BookOpen size={16} className="text-amber-500" />;
      case 'club_post': return <Activity size={16} className="text-violet-400" />;
      default: return <Activity size={16} className="text-neutral-500" />;
    }
  };

  const displayName = item.userDisplayName || 'Usuário';
  const photoURL = item.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

  const userEmoji = userReaction ? REACTION_TYPES.find(r => r.type === userReaction.reactionType)?.emoji : null;

  return (
    <div className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-800 bg-neutral-950 text-neutral-500 group-[.is-active]:text-amber-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mt-2">
        {getActivityIcon(item.type)}
      </div>
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-neutral-950 border border-neutral-800 p-4 rounded-2xl shadow">
        <div className="flex items-center gap-2 mb-2">
          <img src={photoURL} alt={displayName} className="w-8 h-8 rounded-full" />
          <Link to={`/perfil/${item.userId}`} className="text-sm font-medium text-neutral-300 hover:text-amber-500 transition-colors">{displayName}</Link>
          <span className="text-[10px] text-neutral-600 ml-auto">{formatDistanceToNow(item.createdAt, { addSuffix: true, locale: ptBR })}</span>
        </div>
        
        <p className="text-sm text-neutral-300 leading-relaxed mb-4">{item.content}</p>

        {item.type === 'shared_book_updated' && item.metadata && (
          <div className="mb-4 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex gap-3">
            <img 
              src={item.metadata.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.metadata.title)}&background=222&color=fff`} 
              className="w-16 h-20 object-cover border-r border-neutral-800" 
            />
            <div className="p-3 flex flex-col justify-center">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Livro do Mês</p>
              <p className="text-sm font-bold text-neutral-100">{item.metadata.title}</p>
              <p className="text-xs text-neutral-400">{item.metadata.author}</p>
            </div>
          </div>
        )}

        {/* Interaction Bar */}
        <div className="flex flex-col gap-3 pt-3 border-t border-neutral-800/50">
          {aggregatedReactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {aggregatedReactions.map(reaction => (
                <button
                  key={reaction.type}
                  onClick={() => handleToggleReaction(reaction.type)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all ${userReaction?.reactionType === reaction.type ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowPicker(!showPicker)}
                onMouseEnter={() => setShowPicker(true)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasReacted ? 'text-amber-500' : 'text-neutral-500 hover:text-amber-400'}`}
              >
                {userEmoji ? <span className="text-base">{userEmoji}</span> : <Smile size={16} />}
                <span>{hasReacted ? REACTION_TYPES.find(r => r.type === userReaction.reactionType)?.label : 'Expressar'}</span>
              </button>
              
              {showPicker && (
                <div onMouseLeave={() => setShowPicker(false)}>
                  <ReactionPicker 
                    onSelect={handleToggleReaction} 
                    onClose={() => setShowPicker(false)} 
                  />
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-amber-500 transition-colors"
            >
              <MessageSquare size={16} />
              {comments.length > 0 && <span>{comments.length}</span>}
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-4">
            {comments.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-neutral-800/50">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <img src={comment.userPhotoURL} alt={comment.userDisplayName} className="w-6 h-6 rounded-full shrink-0" />
                    <div className="bg-neutral-900 rounded-xl rounded-tl-none p-2.5 flex-1">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <Link to={`/perfil/${comment.userId}`} className="text-xs font-medium text-neutral-300 hover:text-amber-500">{comment.userDisplayName}</Link>
                        <span className="text-[10px] text-neutral-600 shrink-0">{formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: ptBR })}</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
              <button 
                type="submit"
                disabled={!newComment.trim()}
                className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
