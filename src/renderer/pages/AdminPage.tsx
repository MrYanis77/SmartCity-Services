/**
 * Page d'administration — gestion complète des utilisateurs.
 *
 * Fonctionnalités (réservé au rôle `admin`) :
 * - Liste de tous les utilisateurs avec filtre par rôle et recherche textuelle
 * - Création d'un utilisateur (tout rôle)
 * - Modification du rôle, nom, email, téléphone, statut actif
 * - Désactivation / Anonymisation RGPD / Suppression définitive
 *
 * La création et la modification passent par POST/PATCH /api/users.
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { User } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Pencil, Trash2, ShieldOff, Search, X, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

const ROLE_LABELS: Record<string, string> = {
  citoyen: 'Citoyen', agent: 'Agent', responsable: 'Responsable', admin: 'Administrateur',
};
const ROLE_COLORS: Record<string, string> = {
  citoyen: 'bg-blue-100 text-blue-700',
  agent: 'bg-green-100 text-green-700',
  responsable: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
};

/** Formulaire vide pour la création/édition */
const emptyForm = () => ({ full_name: '', email: '', password: '', role: 'citoyen', phone: '' });

const AdminPage = () => {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch]         = useState('');
  const { users, loading, error, refresh } = useUsers(roleFilter);

  // Formulaire de création/édition
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<User | null>(null);
  const [form, setForm]           = useState(emptyForm());
  const [saving, setSaving]       = useState(false);

  // Confirmation suppression
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setShowForm(true); };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role, phone: u.phone ?? '' });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm()); };

  const handleSave = async () => {
    if (!form.full_name || !form.email || (!editing && !form.password)) {
      toast({ title: 'Champs requis', description: 'Nom, email et mot de passe sont obligatoires.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url    = editing ? `${API_URL}/api/users/${editing.id}` : `${API_URL}/api/users`;
      const method = editing ? 'PATCH' : 'POST';
      const body: Record<string, any> = { full_name: form.full_name, email: form.email, role: form.role, phone: form.phone || null };
      if (!editing) body.password = form.password;
      if (!editing) body.consent = true;
      if (form.password && editing) body.password = form.password;

      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Erreur'); }

      toast({ title: editing ? 'Utilisateur mis à jour' : 'Utilisateur créé' });
      closeForm();
      refresh();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      const res = await authFetch(`${API_URL}/api/users/${u.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      if (!res.ok) throw new Error();
      toast({ title: u.is_active ? 'Compte désactivé' : 'Compte activé' });
      refresh();
    } catch { toast({ title: 'Erreur lors de la mise à jour', variant: 'destructive' }); }
  };

  const handleAnonymize = async (u: User) => {
    if (!confirm(`Anonymiser le compte de ${u.full_name} ? Cette action est irréversible (RGPD).`)) return;
    try {
      const res = await authFetch(`${API_URL}/api/users/${u.id}/anonymize`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Compte anonymisé', description: 'Les données personnelles ont été effacées.' });
      refresh();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const handleDelete = async (u: User) => {
    try {
      const res = await authFetch(`${API_URL}/api/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Utilisateur supprimé définitivement' });
      setConfirmDelete(null);
      refresh();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administration</h1>
          <p className="text-muted-foreground">Gestion des comptes utilisateurs.</p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4" aria-hidden="true" /> Ajouter un utilisateur
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <Card key={role} className="cursor-pointer hover:shadow-sm" onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}s</p>
                <p className="text-xl font-bold">{users.filter(u => u.role === role).length}</p>
              </div>
              <span className={cn('text-xs px-2 py-1 rounded-full font-medium', ROLE_COLORS[role])}>
                {users.filter(u => u.role === role && u.is_active).length} actifs
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulaire création/édition inline */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editing ? `Modifier ${editing.full_name}` : 'Nouvel utilisateur'}</CardTitle>
              <button onClick={closeForm} aria-label="Fermer le formulaire"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fn">Nom complet *</Label>
                <Input id="fn" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="em">Email *</Label>
                <Input id="em" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="pw">{editing ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe *'}</Label>
                <Input id="pw" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="mt-1" placeholder={editing ? '••••••••' : ''} />
              </div>
              <div>
                <Label htmlFor="ph">Téléphone</Label>
                <Input id="ph" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="+33 6 12 34 56 78" />
              </div>
              <div>
                <Label htmlFor="rl">Rôle</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger id="rl" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([r, l]) => <SelectItem key={r} value={r}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeForm}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : (editing ? 'Mettre à jour' : 'Créer')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" aria-label="Rechercher un utilisateur" />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={v => setRoleFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px]" aria-label="Filtrer par rôle">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([r, l]) => <SelectItem key={r} value={r}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table utilisateurs */}
      {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {!loading && filtered.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
            )}
            {filtered.map(u => (
              <div key={u.id} className={cn('flex items-center gap-3 p-4', !u.is_active && 'opacity-50')}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 font-medium text-sm">
                  {u.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ROLE_COLORS[u.role] ?? 'bg-gray-100')}>{ROLE_LABELS[u.role]}</span>
                    {!u.is_active && <span className="text-xs text-muted-foreground italic">désactivé</span>}
                    {u.anonymized_at && <span className="text-xs text-destructive italic">anonymisé</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(u)} aria-label={`Modifier ${u.full_name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(u)} aria-label={u.is_active ? 'Désactiver' : 'Activer'}>
                    {u.is_active ? <ShieldOff className="h-3.5 w-3.5 text-orange-500" /> : <Check className="h-3.5 w-3.5 text-green-500" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAnonymize(u)} aria-label={`Anonymiser RGPD ${u.full_name}`}>
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(u)} aria-label={`Supprimer ${u.full_name}`}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <Card className="max-w-sm w-full mx-4">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Supprimer définitivement ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Supprimer <strong>{confirmDelete.full_name}</strong> de façon irréversible ?
                Préférez l'anonymisation RGPD pour conserver l'historique des signalements.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setConfirmDelete(null)}>Annuler</Button>
                <Button variant="destructive" onClick={() => handleDelete(confirmDelete)}>Supprimer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
