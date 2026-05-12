export interface CrearCitaRequest {
  paciente: string;
  doctor: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
}

export interface Cita {
  _id: string;
  paciente: string;
  doctor: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  creadoPor: string;
}

export interface Paciente {
  _id: string;
  nombre: string;
  apellido: string;
}

export interface DoctorItem {
  _id: string;
  usuario?: {
    nombre?: string;
    apellido?: string;
  };
  nombreCompleto?: string;
  nombre?: string;
  apellido?: string;
  especialidad?: string;
}

export interface CitaPaciente {
  _id: string;
  doctor: {
    _id: string;
    nombre?: string;
    apellido?: string;
    especialidad?: string;
    usuario?: {
      nombre?: string;
      apellido?: string;
      email?: string;
    };
  };
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string | EstadoCita;
  creadoPor: string;
  confirmada: boolean;
  createdAt: string;
}

export interface EstadoCita {
  valor: string;
  etiqueta: string;
  color: string;
  icono?: string;
  esPendiente?: boolean;
  esFinalizada?: boolean;
  esCancelada?: boolean;
}

export interface CitaDoctor {
  _id: string;
  paciente: {
    _id: string;
    nombre?: string;
    apellido?: string;
    usuario?: {
      nombre?: string;
      apellido?: string;
    };
  };
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string | EstadoCita;
  creadoPor: string;
  confirmada: boolean;
  createdAt: string;
}

export interface MisCitasResponse {
  citas: CitaPaciente[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDocs: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
