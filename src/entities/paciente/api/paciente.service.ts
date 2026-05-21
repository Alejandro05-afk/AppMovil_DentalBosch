import { apiClient } from '@/shared/api/apiClient';
import {
  PacienteDoctor,
  PacienteDetalle,
  HistorialClinico,
} from '../model/paciente.types';

export const pacienteService = {
  async obtenerMisPacientes(): Promise<PacienteDoctor[]> {
    const response = await apiClient.get<any>('/doctores/mis-pacientes');
    return response.data.datos || response.data.data || [];
  },

  async obtenerDetallePaciente(id: string): Promise<PacienteDetalle> {
    const response = await apiClient.get<any>(`/doctores/pacientes/${id}`);
    return response.data.datos || response.data.data;
  },

  async obtenerHistorialClinico(pacienteId: string): Promise<HistorialClinico> {
    const response = await apiClient.get<any>(`/historial-clinico/${pacienteId}`);
    const data = response.data.datos || response.data.data || response.data;
    return data;
  },
};
