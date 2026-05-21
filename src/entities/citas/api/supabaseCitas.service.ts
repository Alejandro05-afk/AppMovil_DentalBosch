import { supabase } from '@/shared/api/supabaseClient';
import { apiClient } from '@/shared/api/apiClient';
import {
  CrearCitaRequest,
  Cita,
  Paciente,
  DoctorItem,
  MisCitasResponse,
  CitaDoctor,
} from '../model/citas.types';

function checkSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Verificá las credenciales EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en tu .env'
    );
  }
  return supabase;
}

function rowToCitaPaciente(row: any): any {
  return {
    _id: row.id,
    doctor: {
      _id: row.doctor_id,
      nombre: row.doctor_nombre,
      apellido: row.doctor_apellido,
      especialidad: row.doctor_especialidad,
      usuario: {
        nombre: row.doctor_nombre,
        apellido: row.doctor_apellido,
      },
    },
    fecha: row.fecha,
    horaInicio: row.hora_inicio,
    horaFin: row.hora_fin,
    motivo: row.motivo,
    estado: row.estado,
    creadoPor: row.user_id,
    confirmada: row.estado === 'confirmada',
    createdAt: row.created_at,
  };
}

function rowToCita(row: any): Cita {
  return {
    _id: row.id,
    paciente: row.user_id,
    doctor: row.doctor_id,
    fecha: row.fecha,
    horaInicio: row.hora_inicio,
    horaFin: row.hora_fin,
    motivo: row.motivo,
    estado: row.estado,
    creadoPor: row.user_id,
  };
}

export const supabaseCitasService = {
  async agendarCita(data: CrearCitaRequest): Promise<Cita> {
    const client = checkSupabase();
    const user = (await client.auth.getUser()).data.user;
    if (!user) throw new Error('No hay sesión activa');

    // Obtener datos del doctor para desnormalizar
    let doctorNombre = '';
    let doctorApellido = '';
    let doctorEspecialidad = '';
    try {
      const docResp = await apiClient.get<any>(`/doctores/${data.doctor}`);
      const doc = docResp.data?.data || docResp.data?.datos || docResp.data;
      doctorNombre = doc?.usuario?.nombre || doc?.nombre || '';
      doctorApellido = doc?.usuario?.apellido || doc?.apellido || '';
      doctorEspecialidad = doc?.especialidad || '';
    } catch {
      // Si falla, dejamos campos vacíos
    }

    const { data: newRow, error } = await client
      .from('citas')
      .insert({
        user_id: user.id,
        doctor_id: data.doctor,
        doctor_nombre: doctorNombre,
        doctor_apellido: doctorApellido,
        doctor_especialidad: doctorEspecialidad,
        fecha: data.fecha,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
        motivo: data.motivo,
        estado: 'pendiente',
      })
      .select()
      .single();

    if (error) throw error;
    return rowToCita(newRow);
  },

  async obtenerPacientes(): Promise<Paciente[]> {
    const response = await apiClient.get<any>('/pacientes');
    return response.data.datos || response.data.data || [];
  },

  async obtenerDoctores(): Promise<DoctorItem[]> {
    const response = await apiClient.get<any>('/doctores');
    return response.data.datos || response.data.data || [];
  },

  async obtenerMisCitas(params?: {
    estado?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }): Promise<MisCitasResponse> {
    const client = checkSupabase();
    const user = (await client.auth.getUser()).data.user;
    if (!user) throw new Error('No hay sesión activa');

    let query = client
      .from('citas')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false });

    if (params?.estado) {
      query = query.eq('estado', params.estado);
    }
    if (params?.desde) {
      query = query.gte('fecha', params.desde);
    }
    if (params?.hasta) {
      query = query.lte('fecha', params.hasta);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      citas: (data || []).map(rowToCitaPaciente),
      pagination: {
        currentPage: page,
        totalPages: count ? Math.ceil(count / limit) : 1,
        totalDocs: count || 0,
        limit,
        hasNextPage: count ? from + limit < count : false,
        hasPrevPage: page > 1,
      },
    };
  },

  async obtenerCitasDoctor(params?: {
    estado?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }): Promise<{ citas: CitaDoctor[]; pagination?: any }> {
    const client = checkSupabase();
    const user = (await client.auth.getUser()).data.user;
    if (!user) throw new Error('No hay sesión activa');

    let query = client
      .from('citas')
      .select('*', { count: 'exact' })
      .eq('doctor_id', user.id)
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false });

    if (params?.estado) {
      query = query.eq('estado', params.estado);
    }
    if (params?.desde) {
      query = query.gte('fecha', params.desde);
    }
    if (params?.hasta) {
      query = query.lte('fecha', params.hasta);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const citas: CitaDoctor[] = (data || []).map((row: any) => ({
      _id: row.id,
      paciente: {
        _id: row.user_id,
        nombre: '',
        apellido: '',
      },
      fecha: row.fecha,
      horaInicio: row.hora_inicio,
      horaFin: row.hora_fin,
      motivo: row.motivo,
      estado: row.estado,
      creadoPor: row.user_id,
      confirmada: row.estado === 'confirmada',
      createdAt: row.created_at,
    }));

    return {
      citas,
      pagination: {
        currentPage: page,
        totalPages: count ? Math.ceil(count / limit) : 1,
        totalDocs: count || 0,
        limit,
        hasNextPage: count ? from + limit < count : false,
        hasPrevPage: page > 1,
      },
    };
  },

  async obtenerCitasPorDoctorYFecha(doctorId: string, fecha: string): Promise<Cita[]> {
    const client = checkSupabase();
    const { data, error } = await client
      .from('citas')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('fecha', fecha);

    if (error) throw error;
    return (data || []).map(rowToCita);
  },

  async obtenerPerfilDoctor(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/doctores/${id}`);
    return response.data.data || response.data.datos || response.data;
  },

  async cancelarCita(citaId: string, motivoCancelacion: string): Promise<void> {
    const client = checkSupabase();
    const { error } = await client
      .from('citas')
      .update({
        estado: 'cancelada',
        motivo_cancelacion: motivoCancelacion,
      })
      .eq('id', citaId);

    if (error) throw error;
  },
};
