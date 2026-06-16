import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit } from 'lucide-react';
import { Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ stickers: 0, followers: 0, following: 0 });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    favorite_team: '',
    avatar_url: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [processingFollow, setProcessingFollow] = useState(false);

  useEffect(() => {
    // allow viewing another user's profile via global window.__viewUserId
    const targetUserId = // @ts-ignore
      (window && (window as any).__viewUserId) || null;
    loadProfile(targetUserId);
    loadStats(targetUserId);
  }, [user]);

  const loadProfile = async (targetUserId: string | null = null) => {
    // if targetUserId provided, load that profile, otherwise current user
    const uid = targetUserId || user?.id;
    if (!uid) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        favorite_team: data.favorite_team || '',
        avatar_url: data.avatar_url || '',
      });
    }
    setLoading(false);
  };

  const loadStats = async (targetUserId: string | null = null) => {
    const uid = targetUserId || user?.id;
    if (!uid) return;

    // Count stickers
    const { count: stickersCount } = await supabase
      .from('stickers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid);

    // Count followers (users who follow uid)
    const { count: followersCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', uid);

    // Count following (users uid follows)
    const { count: followingCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', uid);

    setStats({
      stickers: stickersCount || 0,
      followers: followersCount || 0,
      following: followingCount || 0,
    });

    // check if current user follows this profile
    try {
      if (user && user.id && uid !== user.id) {
        const { data: followData } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', uid)
          .maybeSingle();

        setIsFollowing(!!followData);
      } else {
        setIsFollowing(false);
      }
    } catch (err) {
      console.error('Error checking follow status', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // prevent saving when viewing someone else's profile
    if (profile?.user_id !== user.id) return;

    await supabase.from('profiles').update(formData).eq('user_id', user.id);

    setEditing(false);
    loadProfile();
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      // sanitize filename and build safe path
      const extMatch = file.name.match(/(\.[^\.\s]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : '';
      const safeFileName = `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const path = `${user.id}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        console.error('Avatar upload error', uploadError);
        throw uploadError;
      }

      const { data } = await supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data?.publicUrl || data?.publicURL || '';

      // update profile immediately so avatar change is visible
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      setFormData((f) => ({ ...f, avatar_url: publicUrl }));
      // reload profile to ensure UI reflects latest data
      await loadProfile();
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !profile) return;
    setProcessingFollow(true);
    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .match({ follower_id: user.id, following_id: profile.user_id });
      } else {
        await supabase
          .from('followers')
          .insert({ follower_id: user.id, following_id: profile.user_id });
      }
      // refresh stats and follow state
      await loadStats(profile.user_id);
    } catch (err) {
      console.error('Follow action failed', err);
    } finally {
      setProcessingFollow(false);
    }
  };

  const handleMessage = () => {
    if (!profile) return;
    // use global event to navigate to messages page (MessagesPage listens to this)
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { page: 'messages', userId: profile.user_id } }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>Meu Perfil</CardTitle>
            {profile && profile.user_id === user?.id && !editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar_file">Avatar</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={formData.avatar_url || profile?.avatar_url || ''} />
                    <AvatarFallback className="text-lg">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Button asChild variant="secondary">
                        <label htmlFor="avatar_file" className="cursor-pointer px-3 py-2 text-sm rounded-md">Escolher arquivo</label>
                      </Button>
                      <input
                        id="avatar_file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          // only allow avatar change for own profile
                          if (profile?.user_id !== user?.id) return;
                          handleAvatarFile(e);
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm text-muted-foreground">{uploadingAvatar ? 'Enviando...' : 'Nenhum arquivo selecionado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                  placeholder="Fale sobre você e sua paixão por figurinhas..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favorite_team">Seleção Favorita</Label>
                <Input
                  id="favorite_team"
                  value={formData.favorite_team}
                  onChange={(e) =>
                    setFormData({ ...formData, favorite_team: e.target.value })
                  }
                  placeholder="Ex: Brasil"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{profile?.full_name || profile?.username}</h2>
                <p className="text-muted-foreground">@{profile?.username}</p>
                {profile?.user_id !== user?.id && (
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      onClick={handleToggleFollow}
                      disabled={processingFollow}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleMessage}
                    >
                      Mensagem
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.stickers}</p>
                  <p className="text-sm text-muted-foreground">Figurinhas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.followers}</p>
                  <p className="text-sm text-muted-foreground">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.following}</p>
                  <p className="text-sm text-muted-foreground">Seguindo</p>
                </div>
              </div>

              {profile?.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Biografia</h3>
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              {profile?.favorite_team && (
                <div>
                  <h3 className="font-semibold mb-2">Seleção Favorita</h3>
                  <p className="text-muted-foreground">🏆 {profile.favorite_team}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
