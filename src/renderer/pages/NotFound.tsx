/**
 * Page 404 – route inconnue.
 * Journalise l'URL tentée dans la console et propose un lien de retour à l'accueil.
 */
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  // Journalisation de la tentative d'accès à une route inexistante
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted" aria-labelledby="not-found-title">
      <div className="text-center">
        <h1 id="not-found-title" className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page introuvable</p>
        <a href="/" className="text-primary underline hover:text-primary/90" aria-label="Retourner à l'accueil de Smart City">
          Retour à l'accueil
        </a>
      </div>
    </main>
  );
};

export default NotFound;
