import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CommentsDialog from './CommentsDialog';

interface StickerCardProps {
  sticker: {
    id: string;
    athlete_name: string;
    team: string;
    position: string;
    number: number;
    image_url: string;
    status: 'have' | 'want' | 'duplicate';
    description: string | null;
    created_at: string;
    user_id: string;
    profiles?: {
      username: string;
      avatar_url: string | null;
      full_name: string | null;
    };
  };
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function StickerCard({ sticker, onDelete, onEdit }: StickerCardProps) {
  const { user, openChatWith } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const statusLabels = {
    have: 'Tenho',
    want: 'Quero',
    duplicate: 'Repetida',
  };

  const statusColors = {
    have: 'bg-have text-have',
    want: 'bg-want text-want',
    duplicate: 'bg-duplicate text-duplicate',
  };

  useEffect(() => {
    loadLikes();
    loadComments();
    checkIfLiked();
    checkIfFollowing();
  }, [sticker.id, user]);

  const loadLikes = async () => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('sticker_id', sticker.id);
    setLikesCount(count || 0);
  };

  const loadComments = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('sticker_id', sticker.id);
    setCommentsCount(count || 0);
  };

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('sticker_id', sticker.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) return;

    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('sticker_id', sticker.id)
        .eq('user_id', user.id);
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      await supabase.from('likes').insert({
        sticker_id: sticker.id,
        user_id: user.id,
      });
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const checkIfFollowing = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('followers')
        .select('id')
        .match({ follower_id: user.id, following_id: sticker.user_id })
        .maybeSingle();
      setIsFollowing(!!data);
    } catch (e) {
      setIsFollowing(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return;
    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .match({ follower_id: user.id, following_id: sticker.user_id });
      setIsFollowing(false);
    } else {
      await supabase.from('followers').insert({ follower_id: user.id, following_id: sticker.user_id });
      setIsFollowing(true);
    }
  };

  const isOwner = user?.id === sticker.user_id;

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src={sticker.profiles?.avatar_url || ''} />
              <AvatarFallback>
                {sticker.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{sticker.profiles?.full_name || sticker.profiles?.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(sticker.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
            {isOwner && (
              <div className="flex gap-1">
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Image: separate mobile and desktop variants
              - mobile (smaller screens): max-height + object-contain
              - desktop (md+): fixed aspect ratio + object-cover (previous behavior)
          */}
          <div className="mb-4">
            {/* Mobile image: full-width, constrained height */}
            <div className="relative w-full rounded-lg overflow-hidden bg-muted md:hidden">
              <img
                src={sticker.image_url}
                alt={sticker.athlete_name}
                className="w-full h-auto max-h-[60vh] sm:max-h-[50vh] object-contain"
              />
            </div>

            {/* Desktop image: keep aspect ratio similar to original */}
            <div className="relative rounded-lg overflow-hidden bg-muted hidden md:block aspect-[3/4]">
              <img
                src={sticker.image_url}
                alt={sticker.athlete_name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{sticker.athlete_name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[sticker.status]}`}>
                {statusLabels[sticker.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{sticker.team}</span>
              <span>#{sticker.number}</span>
              <span>{sticker.position}</span>
            </div>
            {sticker.description && (
              <p className="text-sm mt-2">{sticker.description}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center gap-4 p-4 pt-0">
          <Button
            variant="ghost"
            size="sm"
            className={liked ? 'text-red-500' : ''}
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 mr-1 ${liked ? 'fill-current' : ''}`} />
            {likesCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments(true)}>
            <MessageCircle className="h-5 w-5 mr-1" />
            {commentsCount}
          </Button>
          {!isOwner && (
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={handleFollowToggle}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Button>
              <Button size="sm" onClick={() => openChatWith(sticker.user_id)}>
                Mensagem
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <CommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        stickerId={sticker.id}
        onCommentAdded={loadComments}
      />
    </>
  );
}
