import React from 'react';
import { Outlet } from 'react-router-dom';

export default function PrivateRoute() {
  console.log("⚠️ [Fintech Bypasser] Verrou PrivateRoute désactivé temporairement pour analyse.");
  
  // On laisse passer tout le monde de force pour forcer l'affichage du bug de rendu
  return <Outlet />;
}
