export interface Address {
  calle: string;
  ciudad: string;
  provincia: string;
}

export interface EmergencyContact {
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  rol: string;
  cedula: string;
  telefono: string;
  fechaNacimiento: string;
  genero: string;
  direccion: Address;
  contactoEmergencia: EmergencyContact;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user?: any; // Replace with actual user type if known
  mensaje?: string;
}

export interface UserProfile {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  cedula: string;
  telefono: string;
  fechaNacimiento: string;
  genero: string;
  direccion?: Address;
  contactoEmergencia?: EmergencyContact;
  createdAt: string;
  updatedAt: string;
}
