/**
 * Page de connexion à l'application Smart City.
 *
 * Formulaire email + mot de passe qui appelle POST /api/auth/login via AuthContext.
 * Affiche un message d'erreur si les identifiants sont incorrects.
 *
 * Comptes de démonstration (seed DB) :
 *   marie@example.com / demo  → Citoyen
 *   luc@mairie.fr / demo      → Agent
 *   jean@mairie.fr / demo     → Responsable
 *   admin@mairie.fr / demo    → Admin
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Shield, Users, BarChart3 } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Email ou mot de passe incorrect.');
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  /** Connexion rapide avec le mot de passe par défaut "demo" */
  const quickLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);
    const result = await login(demoEmail, 'demo');
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Connexion impossible.');
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  const demoAccounts = [
    { email: 'marie@example.com', role: 'Citoyen',      icon: Users   },
    { email: 'luc@mairie.fr',     role: 'Agent',         icon: Shield  },
    { email: 'jean@mairie.fr',    role: 'Responsable',   icon: BarChart3 },
    { email: 'admin@mairie.fr',   role: 'Admin',         icon: Shield  },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Panneau gauche — photo d'accueil + présentation */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/assets/images/acceuil.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-primary/90" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground">Smart City</h1>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-primary-foreground leading-tight mb-4">
              Gestion intelligente<br />des alertes urbaines
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-md">
              Signalez les incidents, suivez les interventions et contribuez à améliorer votre ville au quotidien.
            </p>
          </div>
          <div className="flex gap-8 text-primary-foreground/70">
            <div>
              <p className="text-3xl font-bold text-primary-foreground">2,847</p>
              <p className="text-sm">Signalements traités</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">94%</p>
              <p className="text-sm">Taux de résolution</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">48h</p>
              <p className="text-sm">Délai moyen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire de connexion */}
      <div className="flex-1 flex flex-col">
        {/* Bandeau photo sur mobile */}
        <div className="lg:hidden relative h-40 shrink-0 overflow-hidden">
          <img
            src="/assets/images/acceuil.jpg"
            alt="Illustration Smart City — gestion urbaine"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/60" aria-hidden="true" />
          <div className="relative z-10 h-full flex items-center justify-center">
            <h1 className="text-2xl font-bold text-primary-foreground">Smart City</h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Connexion</h2>
            <p className="text-muted-foreground mt-1">Accédez à votre espace de gestion urbaine</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulaire de connexion">
            <div>
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="votre@email.com"
                className="mt-1.5"
                aria-required="true"
                aria-describedby={error ? 'login-error' : undefined}
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="mt-1.5"
                aria-required="true"
                autoComplete="current-password"
              />
            </div>
            {/* Message d'erreur accessible au lecteur d'écran */}
            {error && (
              <p id="login-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">Comptes de démonstration (mot de passe : demo)</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(acc => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => quickLogin(acc.email)}
                    disabled={loading}
                    aria-label={`Connexion rapide en tant que ${acc.role}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span className="text-foreground font-medium">{acc.role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
