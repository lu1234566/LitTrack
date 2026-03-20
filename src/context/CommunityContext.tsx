import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc, where, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { CommunityFeedItem, Comment, Like, Challenge, UserChallenge, Badge, UserBadge, Follow, UserProfile, Community, CommunityMember, CommunityVisibility, CommunityRole } from '../types';

interface CommunityContextType {
  feed: CommunityFeedItem[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  userBadges: UserBadge[];
  badges: Badge[];
  following: string[];
  followers: string[];
  userCommunities: Community[];
  activeCommunity: Community | null;
  setActiveCommunity: (community: Community | null) => void;
  createPost: (content: string, relatedBookId?: string, communityId?: string) => Promise<void>;
  likePost: (feedItemId: string, reactionType: string) => Promise<void>;
  unlikePost: (feedItemId: string) => Promise<void>;
  addComment: (feedItemId: string, content: string) => Promise<void>;
  getComments: (feedItemId: string) => Promise<Comment[]>;
  getLikes: (feedItemId: string) => Promise<Like[]>;
  joinChallenge: (challengeId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  getUserBadges: (userId: string) => Promise<UserBadge[]>;
  getFollowersCount: (userId: string) => Promise<number>;
  getFollowingCount: (userId: string) => Promise<number>;
  checkAndAwardBadges: () => Promise<void>;
  updateChallengeProgress: () => Promise<void>;
  createCommunity: (name: string, description: string, visibility: CommunityVisibility, imageUrl?: string) => Promise<string>;
  joinCommunityByCode: (code: string) => Promise<void>;
  leaveCommunity: (communityId: string) => Promise<void>;
  getCommunityByCode: (code: string) => Promise<Community | null>;
  getCommunityMembers: (communityId: string) => Promise<CommunityMember[]>;
  regenerateInviteCode: (communityId: string) => Promise<string>;
  removeMember: (communityId: string, userId: string) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid I, O, 0, 3
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [feed, setFeed] = useState<CommunityFeedItem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (!db) return;

    // Fetch challenges
    const fetchChallenges = async () => {
      const q = query(collection(db, 'challenges'), where('active', '==', true));
      const snap = await getDocs(q);
      setChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge)));
    };

    // Fetch badges
    const fetchBadges = async () => {
      const snap = await getDocs(collection(db, 'badges'));
      setBadges(snap.docs.map(d => ({ id: d.id, ...d.data() } as Badge)));
    };

    fetchChallenges();
    fetchBadges();
  }, []);

  const createPost = async (content: string, relatedBookId?: string, communityId?: string) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'communityFeed'), {
      userId: user.userId,
      userDisplayName: user.name,
      userPhotoURL: user.profilePhoto,
      type: 'manual',
      content,
      relatedBookId,
      communityId: communityId || (activeCommunity ? activeCommunity.id : null),
      createdAt: Date.now(),
      likesCount: 0,
      commentsCount: 0
    });
  };

  const likePost = async (feedItemId: string, reactionType: string) => {
    if (!user || !db) return;
    
    // Check if already liked
    const q = query(collection(db, 'likes'), where('feedItemId', '==', feedItemId), where('userId', '==', user.userId));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      await addDoc(collection(db, 'likes'), {
        feedItemId,
        userId: user.userId,
        reactionType
      });
      
      // Increment count
      const feedRef = doc(db, 'communityFeed', feedItemId);
      const feedSnap = await getDoc(feedRef);
      if (feedSnap.exists()) {
         const currentCount = feedSnap.data().likesCount || 0;
         await updateDoc(feedRef, { likesCount: currentCount + 1 });
      }
    } else {
      // Update reaction type
      const likeId = snap.docs[0].id;
      await updateDoc(doc(db, 'likes', likeId), { reactionType });
    }
  };

  const unlikePost = async (feedItemId: string) => {
    if (!user || !db) return;
    const q = query(collection(db, 'likes'), where('feedItemId', '==', feedItemId), where('userId', '==', user.userId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      await deleteDoc(doc(db, 'likes', snap.docs[0].id));
      
      // Decrement count
      const feedRef = doc(db, 'communityFeed', feedItemId);
      const feedSnap = await getDoc(feedRef);
      if (feedSnap.exists()) {
         const currentCount = feedSnap.data().likesCount || 0;
         await updateDoc(feedRef, { likesCount: Math.max(0, currentCount - 1) });
      }
    }
  };

  const addComment = async (feedItemId: string, content: string) => {
    if (!user || !db) return;
    await addDoc(collection(db, 'comments'), {
      feedItemId,
      userId: user.userId,
      userDisplayName: user.name,
      userPhotoURL: user.profilePhoto,
      content,
      createdAt: Date.now()
    });
    
    // Increment count
    const feedRef = doc(db, 'communityFeed', feedItemId);
    const feedSnap = await getDoc(feedRef);
    if (feedSnap.exists()) {
       const currentCount = feedSnap.data().commentsCount || 0;
       await updateDoc(feedRef, { commentsCount: currentCount + 1 });
    }
  };

  const getComments = async (feedItemId: string) => {
    if (!db) return [];
    const q = query(collection(db, 'comments'), where('feedItemId', '==', feedItemId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
  };

  const getLikes = async (feedItemId: string) => {
    if (!db) return [];
    const q = query(collection(db, 'likes'), where('feedItemId', '==', feedItemId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Like));
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user || !db) return;
    
    // Check if already joined
    const q = query(collection(db, 'userChallenges'), where('challengeId', '==', challengeId), where('userId', '==', user.userId));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      await addDoc(collection(db, 'userChallenges'), {
        userId: user.userId,
        challengeId,
        progress: 0,
        completed: false
      });
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user || !db || user.userId === targetUserId) return;
    
    const q = query(collection(db, 'follows'), where('followerId', '==', user.userId), where('followingId', '==', targetUserId));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      await addDoc(collection(db, 'follows'), {
        followerId: user.userId,
        followingId: targetUserId,
        createdAt: Date.now()
      });
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user || !db) return;
    
    const q = query(collection(db, 'follows'), where('followerId', '==', user.userId), where('followingId', '==', targetUserId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      await deleteDoc(doc(db, 'follows', snap.docs[0].id));
    }
  };

  const getUserBadges = async (targetUserId: string) => {
    if (!db) return [];
    const q = query(collection(db, 'userBadges'), where('userId', '==', targetUserId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserBadge));
  };

  const getFollowersCount = async (targetUserId: string) => {
    if (!db) return 0;
    const q = query(collection(db, 'follows'), where('followingId', '==', targetUserId));
    const snap = await getDocs(q);
    return snap.size;
  };

  const getFollowingCount = async (targetUserId: string) => {
    if (!db) return 0;
    const q = query(collection(db, 'follows'), where('followerId', '==', targetUserId));
    const snap = await getDocs(q);
    return snap.size;
  };

  const checkAndAwardBadges = React.useCallback(async () => {
    if (!user || !db) return;
    
    const userRef = doc(db, 'users', user.userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const stats = userSnap.data();
    
    const badgesSnap = await getDocs(collection(db, 'badges'));
    const allBadges = badgesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Badge));
    
    const userBadgesSnap = await getDocs(query(collection(db, 'userBadges'), where('userId', '==', user.userId)));
    const earnedBadgeIds = userBadgesSnap.docs.map(d => d.data().badgeId);
    
    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;
      
      let earned = false;
      if (badge.id === 'first_book' && stats.booksRead >= 1) earned = true;
      if (badge.id === 'ten_books' && stats.booksRead >= 10) earned = true;
      if (badge.id === 'hundred_pages' && stats.pagesRead >= 100) earned = true;
      if (badge.id === 'thousand_pages' && stats.pagesRead >= 1000) earned = true;
      if (badge.id === 'streak_7' && stats.readingStreak >= 7) earned = true;
      
      if (earned) {
        await addDoc(collection(db, 'userBadges'), {
          userId: user.userId,
          badgeId: badge.id,
          earnedAt: Date.now()
        });
        
        await addDoc(collection(db, 'communityFeed'), {
          userId: user.userId,
          userDisplayName: user.name,
          userPhotoURL: user.profilePhoto,
          type: 'badge_earned',
          content: `Ganhou a conquista: ${badge.name}!`,
          createdAt: Date.now(),
          likesCount: 0,
          commentsCount: 0
        });
      }
    }
  }, [user, db]);

  const updateChallengeProgress = React.useCallback(async () => {
    if (!user || !db) return;
    
    const userRef = doc(db, 'users', user.userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const stats = userSnap.data();
    
    const q = query(collection(db, 'userChallenges'), where('userId', '==', user.userId), where('completed', '==', false));
    const snap = await getDocs(q);
    
    for (const docSnap of snap.docs) {
      const userChallenge = { id: docSnap.id, ...docSnap.data() } as UserChallenge;
      const challenge = challenges.find(c => c.id === userChallenge.challengeId);
      if (!challenge) continue;
      
      let newProgress = userChallenge.progress;
      
      if (challenge.goalType === 'books_read') {
        newProgress = stats.booksRead || 0;
      } else if (challenge.goalType === 'pages_read') {
        newProgress = stats.pagesRead || 0;
      } else if (challenge.goalType === 'streak') {
        newProgress = stats.readingStreak || 0;
      }
      
      const target = Number(challenge.goalValue);
      const completed = newProgress >= target;
      
      if (newProgress !== userChallenge.progress || completed) {
        await updateDoc(doc(db, 'userChallenges', userChallenge.id), {
          progress: newProgress,
          completed
        });
        
        if (completed) {
          await addDoc(collection(db, 'communityFeed'), {
            userId: user.userId,
            userDisplayName: user.name,
            userPhotoURL: user.profilePhoto,
            type: 'challenge_completed',
            content: `Completou o desafio: ${challenge.title}!`,
            createdAt: Date.now(),
            likesCount: 0,
            commentsCount: 0
          });
        }
      }
    }
  }, [user, db, challenges]);

  const createCommunity = async (name: string, description: string, visibility: CommunityVisibility, imageUrl?: string) => {
    if (!user || !db) throw new Error('Not authenticated');
    
    let inviteCode = generateInviteCode();
    // Simple check for uniqueness
    const q = query(collection(db, 'communities'), where('inviteCode', '==', inviteCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      inviteCode = generateInviteCode();
    }

    const commRef = await addDoc(collection(db, 'communities'), {
      name,
      description,
      visibility,
      imageUrl: imageUrl || `https://picsum.photos/seed/${name}/400/400`,
      ownerId: user.userId,
      inviteCode,
      createdAt: Date.now(),
      memberCount: 1
    });

    await addDoc(collection(db, 'communityMembers'), {
      communityId: commRef.id,
      userId: user.userId,
      userDisplayName: user.name,
      userPhotoURL: user.profilePhoto,
      role: 'owner',
      joinedAt: Date.now()
    });

    await addDoc(collection(db, 'communityFeed'), {
      userId: user.userId,
      userDisplayName: user.name,
      userPhotoURL: user.profilePhoto,
      type: 'community_created',
      content: `Criou a comunidade: ${name}`,
      communityId: commRef.id,
      createdAt: Date.now(),
      likesCount: 0,
      commentsCount: 0
    });

    return commRef.id;
  };

  const joinCommunityByCode = async (code: string) => {
    if (!user || !db) throw new Error('Not authenticated');
    
    const q = query(collection(db, 'communities'), where('inviteCode', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    
    if (snap.empty) throw new Error('Código inválido');
    
    const community = { id: snap.docs[0].id, ...snap.docs[0].data() } as Community;
    
    // Check if already a member
    const qMem = query(collection(db, 'communityMembers'), where('communityId', '==', community.id), where('userId', '==', user.userId));
    const snapMem = await getDocs(qMem);
    
    if (!snapMem.empty) throw new Error('Você já faz parte desta comunidade');

    await addDoc(collection(db, 'communityMembers'), {
      communityId: community.id,
      userId: user.userId,
      userDisplayName: user.name,
      userPhotoURL: user.profilePhoto,
      role: 'member',
      joinedAt: Date.now()
    });

    await updateDoc(doc(db, 'communities', community.id), {
      memberCount: (community.memberCount || 0) + 1
    });
  };

  const leaveCommunity = async (communityId: string) => {
    if (!user || !db) return;
    
    const q = query(collection(db, 'communityMembers'), where('communityId', '==', communityId), where('userId', '==', user.userId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const member = snap.docs[0].data() as CommunityMember;
      if (member.role === 'owner') throw new Error('O proprietário não pode sair da comunidade');
      
      await deleteDoc(doc(db, 'communityMembers', snap.docs[0].id));
      
      const commRef = doc(db, 'communities', communityId);
      const commSnap = await getDoc(commRef);
      if (commSnap.exists()) {
        await updateDoc(commRef, {
          memberCount: Math.max(0, (commSnap.data().memberCount || 1) - 1)
        });
      }
    }
  };

  const getCommunityByCode = async (code: string) => {
    if (!db) return null;
    const q = query(collection(db, 'communities'), where('inviteCode', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Community;
  };

  const getCommunityMembers = async (communityId: string) => {
    if (!db) return [];
    const q = query(collection(db, 'communityMembers'), where('communityId', '==', communityId), orderBy('joinedAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityMember));
  };

  const regenerateInviteCode = async (communityId: string) => {
    if (!db) return '';
    const newCode = generateInviteCode();
    await updateDoc(doc(db, 'communities', communityId), {
      inviteCode: newCode
    });
    return newCode;
  };

  const removeMember = async (communityId: string, targetUserId: string) => {
    if (!user || !db) return;
    
    // Check if current user is owner/admin
    const qMe = query(collection(db, 'communityMembers'), where('communityId', '==', communityId), where('userId', '==', user.userId));
    const snapMe = await getDocs(qMe);
    if (snapMe.empty) return;
    const myRole = snapMe.docs[0].data().role;
    if (myRole !== 'owner' && myRole !== 'admin') return;

    const qTarget = query(collection(db, 'communityMembers'), where('communityId', '==', communityId), where('userId', '==', targetUserId));
    const snapTarget = await getDocs(qTarget);
    
    if (!snapTarget.empty) {
      await deleteDoc(doc(db, 'communityMembers', snapTarget.docs[0].id));
      
      const commRef = doc(db, 'communities', communityId);
      const commSnap = await getDoc(commRef);
      if (commSnap.exists()) {
        await updateDoc(commRef, {
          memberCount: Math.max(0, (commSnap.data().memberCount || 1) - 1)
        });
      }
    }
  };

  useEffect(() => {
    if (!db || !user) return;

    // Listen to feed (global or community specific)
    const feedQuery = activeCommunity 
      ? query(collection(db, 'communityFeed'), where('communityId', '==', activeCommunity.id), orderBy('createdAt', 'desc'), limit(50))
      : query(collection(db, 'communityFeed'), where('communityId', '==', null), orderBy('createdAt', 'desc'), limit(50));

    const unsubFeed = onSnapshot(feedQuery, (snap) => {
      setFeed(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityFeedItem)));
    });

    // Listen to user challenges
    const qUserChallenges = query(collection(db, 'userChallenges'), where('userId', '==', user.userId));
    const unsubUserChallenges = onSnapshot(qUserChallenges, (snap) => {
      setUserChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserChallenge)));
    });

    // Listen to user badges
    const qUserBadges = query(collection(db, 'userBadges'), where('userId', '==', user.userId));
    const unsubUserBadges = onSnapshot(qUserBadges, (snap) => {
      setUserBadges(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserBadge)));
    });

    // Listen to following
    const qFollowing = query(collection(db, 'follows'), where('followerId', '==', user.userId));
    const unsubFollowing = onSnapshot(qFollowing, (snap) => {
      setFollowing(snap.docs.map(d => d.data().followingId));
    });

    // Listen to followers
    const qFollowers = query(collection(db, 'follows'), where('followingId', '==', user.userId));
    const unsubFollowers = onSnapshot(qFollowers, (snap) => {
      setFollowers(snap.docs.map(d => d.data().followerId));
    });

    // Listen to user communities
    const qUserCommunities = query(collection(db, 'communityMembers'), where('userId', '==', user.userId));
    const unsubUserCommunities = onSnapshot(qUserCommunities, async (snap) => {
      const communityIds = snap.docs.map(d => d.data().communityId);
      if (communityIds.length === 0) {
        setUserCommunities([]);
        return;
      }
      
      // Fetch community details
      const communities: Community[] = [];
      for (const id of communityIds) {
        const cSnap = await getDoc(doc(db, 'communities', id));
        if (cSnap.exists()) {
          communities.push({ id: cSnap.id, ...cSnap.data() } as Community);
        }
      }
      setUserCommunities(communities);
    });

    // Listen to user stats to trigger badges and challenges check
    const unsubUserStats = onSnapshot(doc(db, 'users', user.userId), (snap) => {
      if (snap.exists()) {
        checkAndAwardBadges();
        updateChallengeProgress();
      }
    });

    return () => {
      unsubFeed();
      unsubUserChallenges();
      unsubUserBadges();
      unsubFollowing();
      unsubFollowers();
      unsubUserCommunities();
      unsubUserStats();
    };
  }, [user, db, checkAndAwardBadges, updateChallengeProgress, activeCommunity]);

  return (
    <CommunityContext.Provider value={{
      feed, challenges, userChallenges, badges, userBadges, following, followers,
      userCommunities, activeCommunity, setActiveCommunity,
      createPost, likePost, unlikePost, addComment, getComments, getLikes,
      joinChallenge, followUser, unfollowUser, getUserBadges, getFollowersCount, getFollowingCount,
      checkAndAwardBadges, updateChallengeProgress,
      createCommunity, joinCommunityByCode, leaveCommunity, getCommunityByCode, getCommunityMembers,
      regenerateInviteCode, removeMember
    }}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
