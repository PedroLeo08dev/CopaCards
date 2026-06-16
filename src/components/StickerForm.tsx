import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface StickerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editSticker?: any;
}

export default function StickerForm({
  open,
  onOpenChange,
  onSuccess,
  editSticker,
}: StickerFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    athlete_name: '',
    team: '',
    position: '',
    number: '',
    image_url: '',
    status: 'have' as 'have' | 'want' | 'duplicate',
    description: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (editSticker) {
      setFormData({
        athlete_name: editSticker.athlete_name,
        team: editSticker.team,
        position: editSticker.position,
        number: editSticker.number.toString(),
        image_url: editSticker.image_url,
        status: editSticker.status,
        description: editSticker.description || '',
      });
      setPreviewUrl(editSticker.image_url || null);
    } else {
      setFormData({
        athlete_name: '',
        team: '',
        position: '',
        number: '',
        image_url: '',
        status: 'have',
        description: '',
      });
      setFile(null);
      setPreviewUrl(null);
    }
  }, [editSticker, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    // Validate presence of an image when creating a new sticker
    if (!editSticker && !file && !formData.image_url) {
      alert('Selecione uma imagem para a figurinha.');
      setLoading(false);
      return;
    }

    const data = {
      ...formData,
      number: parseInt(formData.number),
      user_id: user.id,
    };

    try {
      // If a file was selected, upload it to Supabase Storage
      if (file) {
        // Build a safe filename: timestamp + random + original extension
        const extMatch = file.name.match(/(\.[^\.\s]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : '';
        const safeFileName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
        const filePath = `${user.id}/${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('stickers')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error', uploadError);
          alert('Erro ao enviar a imagem. Tente novamente.');
          setLoading(false);
          return;
        }

        const { data: publicData } = await supabase.storage
          .from('stickers')
          .getPublicUrl(filePath);

        // support different possible response shapes
        data.image_url = (publicData && (publicData.publicUrl || publicData.publicURL)) || formData.image_url;
      }

      if (editSticker) {
        await supabase.from('stickers').update(data).eq('id', editSticker.id);
      } else {
        await supabase.from('stickers').insert(data);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar a figurinha.');
    }

    setLoading(false);
    onSuccess();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#071226] text-black dark:text-white">
        <DialogHeader>
          <DialogTitle>
            {editSticker ? 'Editar Figurinha' : 'Nova Figurinha'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="athlete_name">Nome do Atleta *</Label>
            <Input
              id="athlete_name"
              value={formData.athlete_name}
              onChange={(e) => setFormData({ ...formData, athlete_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Seleção *</Label>
            <Input
              id="team"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              placeholder="Ex: Brasil, Argentina, França..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Posição *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Atacante"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                min="1"
                max="99"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_file">Foto da Figurinha *</Label>
            <div className="flex items-center gap-3">
              <Button asChild variant="secondary">
                <label htmlFor="image_file" className="cursor-pointer px-3 py-2 text-sm rounded-md">Escolher arquivo</label>
              </Button>
              <input
                id="image_file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              <span className="text-sm text-muted-foreground">{file ? file.name : (previewUrl ? 'Imagem atual' : 'Nenhuma imagem selecionada')}</span>
            </div>
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="mt-2 max-h-48 w-full object-cover rounded" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              <option value="have">✓ Tenho</option>
              <option value="want">★ Quero</option>
              <option value="duplicate">⚡ Repetida</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Escreva sobre essa figurinha..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : editSticker ? 'Salvar' : 'Publicar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
