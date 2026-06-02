/**
 * Formulaire de création d'un nouveau signalement urbain.
 *
 * Fonctionnalités :
 * - Sélection de catégorie / sous-catégorie / priorité
 * - Description textuelle
 * - Upload de photo (input file natif, prévisualisation, chemin stocké)
 * - Saisie d'adresse
 * - Consentement RGPD explicite obligatoire (§3.2)
 * - Envoi réel via POST /api/incidents avec authFetch (JWT)
 */
import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationMap } from '@/components/LocationMap';
import { fileToBase64 } from '@/lib/media';
import {
  CATEGORY_LABELS,
  CATEGORY_SUBCATEGORIES,
  PRIORITY_LABELS,
  SignalementCategory,
  SignalementPriority,
} from '@/types/signalement';
import { Camera, MapPin, Send, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

const ReportPage = () => {
  const { user, authFetch } = useAuth();
  const { toast } = useToast();

  const [category, setCategory]       = useState<SignalementCategory | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [priority, setPriority]       = useState<SignalementPriority>('moyen');
  const [description, setDescription] = useState('');
  const [address, setAddress]         = useState('');
  const [latitude, setLatitude]       = useState(0);
  const [longitude, setLongitude]     = useState(0);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Gestion de la photo
  const fileInputRef               = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile]  = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const subcategories = category ? CATEGORY_SUBCATEGORIES[category] : [];

  const handleCoordsChange = useCallback((coords: { latitude: number; longitude: number } | null) => {
    if (coords) {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    // Prévisualisation locale via URL objet
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setSubmitted(false);
    setCategory('');
    setSubcategory('');
    setPriority('moyen');
    setDescription('');
    setAddress('');
    setLatitude(0);
    setLongitude(0);
    setRgpdConsent(false);
    removePhoto();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subcategory || !description || !address) {
      toast({ title: 'Champs requis', description: 'Veuillez remplir tous les champs obligatoires.', variant: 'destructive' });
      return;
    }
    if (!rgpdConsent) {
      toast({ title: 'Consentement requis', description: 'Vous devez accepter la politique de confidentialité.', variant: 'destructive' });
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      let photoData: string | undefined;
      if (photoFile) {
        photoData = await fileToBase64(photoFile);
      }

      const res = await authFetch(`${API_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory,
          priority,
          description,
          address,
          latitude,
          longitude,
          ...(photoData && {
            photo_data: photoData,
            photo_filename: photoFile!.name,
            photo_mime: photoFile!.type,
          }),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erreur lors de l\'envoi');
      }

      setSubmitted(true);
      toast({ title: 'Signalement envoyé', description: 'Votre signalement a été enregistré avec succès.' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] animate-scale-in"
        aria-live="polite"
      >
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Signalement envoyé !</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-sm">
          Votre signalement a été enregistré. Vous serez notifié de son avancement.
        </p>
        <Button variant="outline" className="mt-6" onClick={reset}>
          Nouveau signalement
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouveau signalement</h1>
        <p className="text-muted-foreground">Décrivez l'incident que vous souhaitez signaler.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catégorie de l'incident</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v as SignalementCategory); setSubcategory(''); }}>
                  <SelectTrigger className="mt-1.5" id="category" aria-required="true">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subcategory">Sous-catégorie *</Label>
                <Select value={subcategory} onValueChange={setSubcategory} disabled={!category}>
                  <SelectTrigger className="mt-1.5" id="subcategory" aria-required="true" aria-disabled={!category}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select value={priority} onValueChange={v => setPriority(v as SignalementPriority)}>
                <SelectTrigger className="mt-1.5" id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Description + Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Description de l'incident *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez le problème rencontré..."
                className="mt-1.5 min-h-[100px]"
                aria-required="true"
              />
            </div>

            {/* Upload photo */}
            <div>
              <Label>Photo (facultatif)</Label>
              {/* Input file caché — déclenché par clic sur la zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                aria-label="Sélectionner une photo"
              />
              {photoPreview ? (
                <div className="mt-1.5 relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Aperçu de la photo sélectionnée"
                    className="max-h-48 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    aria-label="Supprimer la photo"
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Cliquez pour ajouter une photo</p>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" /> Localisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="ex: 12 Rue de la Paix, 75002 Paris"
                className="mt-1.5"
                aria-required="true"
              />
            </div>
            <div className="mt-4">
              <LocationMap
                address={address}
                latitude={latitude}
                longitude={longitude}
                onCoordinatesChange={handleCoordsChange}
                height={240}
              />
            </div>
          </CardContent>
        </Card>

        {/* Consentement RGPD */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
          <input
            id="rgpd-consent"
            type="checkbox"
            checked={rgpdConsent}
            onChange={e => setRgpdConsent(e.target.checked)}
            aria-required="true"
            className="mt-1 h-4 w-4 cursor-pointer"
          />
          <label htmlFor="rgpd-consent" className="text-sm text-muted-foreground cursor-pointer">
            <span className="font-medium text-foreground">Consentement RGPD *</span>
            {' '}J'accepte que mes données personnelles (localisation, description) soient
            traitées par la municipalité dans le cadre de la gestion des incidents urbains.
            Ces données seront conservées 2 ans après la clôture du dossier.
          </label>
        </div>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={!rgpdConsent || submitting}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Envoi en cours…' : 'Envoyer le signalement'}
        </Button>
      </form>
    </div>
  );
};

export default ReportPage;
