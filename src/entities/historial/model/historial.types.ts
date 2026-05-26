export interface Consulta {
  _id: string;
  fecha: string;
  motivoConsulta: string;
  diagnosticos?: {
    descripcion?: string;
    observaciones?: string;
    [key: string]: any;
  }[];
  tratamientos?: {
    procedimiento?: string;
    indicaciones?: string;
    [key: string]: any;
  }[];
  doctor?: {
    usuario?: {
      nombre?: string;
      apellido?: string;
    };
    especialidad?: string;
  };
  cita?: {
    motivo?: string;
    fecha?: string;
    estado?: string;
    [key: string]: any;
  };
  odontograma?: any;
  [key: string]: any;
}

export interface HistorialClinicoDatos {
  _id?: string;
  paciente?: any;
  numeroHistoriaClinica?: string;
  consultas: Consulta[];
  informacionComplementaria?: {
    grupoEtario?: string;
    edad?: number;
    nombreCompleto?: string;
    [key: string]: any;
  };
  [key: string]: any;
}
