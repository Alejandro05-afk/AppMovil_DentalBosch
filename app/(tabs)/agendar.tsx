import React, { useEffect, useState } from 'react';
import { authService } from '@/entities/auth/api/auth.service';
import { LoadingScreen } from '@/shared/ui';
import { AgendarCitaPage } from '@/pages/citas/AgendarCitaPage';
import { DoctorCitasPage } from '@/pages/citas/DoctorCitasPage';

export default function CitasScreen() {
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    authService
      .getProfile()
      .then((p) => setRol(p.rol))
      .catch(() => setRol(''));
  }, []);

  if (rol === null) return <LoadingScreen message="Cargando..." fullScreen />;
  if (rol === 'doctor') return <DoctorCitasPage />;
  return <AgendarCitaPage />;
}
