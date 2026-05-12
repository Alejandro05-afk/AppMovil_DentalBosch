export interface UserProfile {
  nombre: string;
  apellido: string;
  cedula: string;           // solo lectura — no editable
  email: string;            // solo lectura — no editable
  rol: string;
  fechaNacimiento: string;  // 'YYYY-MM-DD'
  genero: string;
  telefono: string;
  direccion: {
    calle: string;
    ciudad: string;
    provincia: string;
  };
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    parentesco: string;
  };
  avatarUrl?: string;
}
