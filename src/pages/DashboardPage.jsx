import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirige silencieusement vers le véritable tableau de bord centralisé
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-xs text-[#00A3E0]">
      Redirection vers l'Espace Assuré...
    </div>
  );
}
