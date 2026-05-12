export interface HorarioAtencion {
  dia: string;
  disponible: boolean;
  horaInicio: string;
  horaFin: string;
}

export interface DoctorProfile {
  _id: string;
  usuario: {
    _id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  especialidad: string;
  experiencia: string;
  consultorio: string;
  horarioAtencion: HorarioAtencion[];
  activo: boolean;
  createdAt: string;
}
