import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stickerId: string;
  onCommentAdded?: () => void;
}

export default function CommentsDialog({
  open,
  onOpenChange,
  stickerId,
  onCommentAdded,
}: CommentsDialogProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [open, stickerId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          full_name
        )
      `)
      .eq('sticker_id', stickerId)
      .order('created_at', { ascending: false });

    if (data) {
      setComments(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    await supabase.from('comments').insert({
      sticker_id: stickerId,
      user_id: user.id,
      content: newComment.trim(),
    });

    setNewComment('');
    setLoading(false);
    loadComments();
    onCommentAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col bg-white dark:bg-[#071226] text-black dark:text-white">
        <DialogHeader>
          <DialogTitle>Comentários</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.profiles?.avatar_url || ''} />
                <AvatarFallback>
                  {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {comment.profiles?.full_name || comment.profiles?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px]"
          />
          <Button type="submit" disabled={loading || !newComment.trim()}>
            Enviar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
