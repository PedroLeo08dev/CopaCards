import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import StickerCard from '@/components/StickerCard';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const [stickers, setStickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);

  useEffect(() => {
    loadStickers();
    // clear user results when query cleared
    if (!query) setUserResults([]);

    // Subscribe to new stickers
    const subscription = supabase
      .channel('stickers_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stickers' },
        () => {
          loadStickers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // search users when query changes (debounced)
  useEffect(() => {
    if (!query) return;
    const t = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setUserResults([]);
        return;
      }

      // search profiles by username or full_name
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, full_name')
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(10);

      setUserResults(data || []);
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  const loadStickers = async () => {
    const { data } = await supabase
      .from('stickers')
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setStickers(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-4">
        <Input
          placeholder="Buscar por jogador, time, usuário ou descrição"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {userResults.length > 0 && (
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-semibold">Usuários</h3>
          <div className="flex flex-col gap-2">
            {userResults.map((u) => (
              <button
                key={u.user_id}
                onClick={() => {
                  // navigate to profile and indicate target user
                  window.dispatchEvent(new CustomEvent('app:navigate', { detail: { page: 'profile', userId: u.user_id } }));
                }}
                className="flex items-center gap-3 p-2 rounded hover:bg-muted"
              >
                <img src={u.avatar_url || ''} alt={u.username} className="h-8 w-8 rounded-full object-cover" />
                <div className="text-left">
                  <div className="font-medium">{u.full_name || u.username}</div>
                  <div className="text-xs text-muted-foreground">@{u.username}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {stickers.filter((s) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          (s.athlete_name || '').toLowerCase().includes(q) ||
          (s.team || '').toLowerCase().includes(q) ||
          (s.profiles?.username || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q)
        );
      }).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhuma figurinha publicada ainda.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Seja o primeiro a compartilhar!
          </p>
        </div>
      ) : (
        stickers
          .filter((s) => {
            if (!query) return true;
            const q = query.toLowerCase();
            return (
              (s.athlete_name || '').toLowerCase().includes(q) ||
              (s.team || '').toLowerCase().includes(q) ||
              (s.profiles?.username || '').toLowerCase().includes(q) ||
              (s.description || '').toLowerCase().includes(q)
            );
          })
          .map((sticker) => (
            <StickerCard key={sticker.id} sticker={sticker} />
          ))
      )}
    </div>
  );
}
