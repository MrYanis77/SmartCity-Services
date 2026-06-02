/**
 * Page d'entrée de l'application.
 * Redirige automatiquement l'utilisateur connecté vers le tableau de bord ;
 * affiche la page de connexion sinon.
 */
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';

const Index = () => {
  const { user } = useAuth();

  // Redirection immédiate si l'utilisateur est déjà authentifié
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
};

export default Index;
