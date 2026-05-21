export interface PacienteDoctor {
  _id: string;
  usuario?: {
    nombre?: string;
    apellido?: string;
    cedula?: string;
    telefono?: string;
    email?: string;
  };
  nombre?: string;
  apellido?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
}

export interface PacienteDetalle {
  _id: string;
  usuario?: {
    nombre?: string;
    apellido?: string;
    cedula?: string;
    telefono?: string;
    email?: string;
  };
  nombre?: string;
  apellido?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: string;
  genero?: string;
  direccion?: {
    calle?: string;
    ciudad?: string;
    provincia?: string;
  };
  contactoEmergencia?: {
    nombre?: string;
    telefono?: string;
    parentesco?: string;
  };
}

export interface ConsultaHistorial {
  _id: string;
  fecha: string;
  motivo?: string;
  observaciones?: string;
  tratamientos?: string;
  odontograma?: any;
}

export interface HistorialClinico {
  _id: string;
  paciente: string;
  antecedentes?: string | Record<string, any>;
  consultas?: ConsultaHistorial[];
  odontograma?: any;
}
