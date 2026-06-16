import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import StickerCard from '@/components/StickerCard';
import StickerForm from '@/components/StickerForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function CollectionPage() {
  const { user } = useAuth();
  const [stickers, setStickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSticker, setEditingSticker] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadStickers();
  }, [user]);

  const loadStickers = async () => {
    if (!user) return;

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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setStickers(data);
    }
    setLoading(false);
  };

  const handleDelete = async (stickerId: string) => {
    if (confirm('Tem certeza que deseja excluir esta figurinha?')) {
      await supabase.from('stickers').delete().eq('id', stickerId);
      loadStickers();
    }
  };

  const handleEdit = (sticker: any) => {
    setEditingSticker(sticker);
    setShowForm(true);
  };

  const filterStickers = (status?: string) => {
    if (!status) return stickers;
    return stickers.filter((s) => s.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Minha Coleção</h1>
          <p className="text-muted-foreground">
            Total de figurinhas: {stickers.length}
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-2">
              <TabsTrigger value="all" className="px-2 py-1 text-sm bg-secondary text-white hover:opacity-90 rounded-md justify-center">Todas</TabsTrigger>
              <TabsTrigger value="have" className="px-2 py-1 text-sm bg-secondary text-white hover:opacity-90 rounded-md justify-center">Tenho</TabsTrigger>
              <TabsTrigger value="want" className="px-2 py-1 text-sm bg-secondary text-white hover:opacity-90 rounded-md justify-center">Quero</TabsTrigger>
              <TabsTrigger value="duplicate" className="px-2 py-1 text-sm bg-secondary text-white hover:opacity-90 rounded-md justify-center">Repetidas</TabsTrigger>
            </TabsList>

          <TabsContent value="all" className="grid md:grid-cols-2 gap-6 mt-6">
            {stickers.map((sticker) => (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                onDelete={() => handleDelete(sticker.id)}
                onEdit={() => handleEdit(sticker)}
              />
            ))}
            {stickers.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <p className="text-muted-foreground">Sua coleção está vazia.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="have" className="grid md:grid-cols-2 gap-6 mt-6">
            {filterStickers('have').map((sticker) => (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                onDelete={() => handleDelete(sticker.id)}
                onEdit={() => handleEdit(sticker)}
              />
            ))}
            {filterStickers('have').length === 0 && (
              <div className="col-span-2 text-center py-12">
                <p className="text-muted-foreground">Nenhuma figurinha nesta categoria.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="want" className="grid md:grid-cols-2 gap-6 mt-6">
            {filterStickers('want').map((sticker) => (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                onDelete={() => handleDelete(sticker.id)}
                onEdit={() => handleEdit(sticker)}
              />
            ))}
            {filterStickers('want').length === 0 && (
              <div className="col-span-2 text-center py-12">
                <p className="text-muted-foreground">Nenhuma figurinha nesta categoria.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="duplicate" className="grid md:grid-cols-2 gap-6 mt-6">
            {filterStickers('duplicate').map((sticker) => (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                onDelete={() => handleDelete(sticker.id)}
                onEdit={() => handleEdit(sticker)}
              />
            ))}
            {filterStickers('duplicate').length === 0 && (
              <div className="col-span-2 text-center py-12">
                <p className="text-muted-foreground">Nenhuma figurinha nesta categoria.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <StickerForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingSticker(null);
        }}
        onSuccess={loadStickers}
        editSticker={editingSticker}
      />
    </>
  );
}
