import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 5 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
  },
};

const BASE_URL = 'https://backend-dental-bosch-vr8o.onrender.com/api';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'guanoluisaalejandro5@gmail.com',
    password: 'Alejo2005g#',
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = loginRes.json('token') || loginRes.json('data.token');
  if (!token) return { token: null, pacienteId: null };

  const perfilRes = http.get(`${BASE_URL}/pacientes/perfil/paciente`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  const perfilData = perfilRes.json();
  const pacienteId = perfilData?.datos?._id || perfilData?.data?._id || perfilData?._id;

  const doctoresRes = http.get(`${BASE_URL}/doctores`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const doctores = doctoresRes.json()?.data || doctoresRes.json()?.datos || [];

  // Limpiar citas pendientes para dejar espacio
  const params = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
  const misCitasRes = http.get(`${BASE_URL}/citas/mis-citas?limit=50`, params);
  const citas = misCitasRes.json()?.datos?.citas || [];
  for (const c of citas) {
    if (c.estado === 'pendiente') {
      http.del(`${BASE_URL}/citas/${c._id || c.id}`, JSON.stringify({ motivoCancelacion: 'Limpieza setup' }), params);
    }
  }

  return { token, pacienteId, doctores };
}

function generarFecha(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function (data) {
  if (!data.token || !data.pacienteId || !data.doctores?.length) return;

  const params = {
    headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' },
  };

  const doctor = data.doctores[__VU % data.doctores.length];

  group('agendar cita', () => {
    const fecha = generarFecha(7 + (__VU * 5 + __ITER) % 30);

    const slotsRes = http.get(
      `${BASE_URL}/citas/slots-ocupados?doctor=${doctor._id}&fecha=${fecha}`,
      params
    );
    check(slotsRes, { 'slots 200': (r) => r.status === 200 });

    const ocupados = slotsRes.json()?.datos?.slotsOcupados || [];
    const disponibles = [];
    for (let h = 8; h < 17; h++) {
      const s = `${String(h).padStart(2, '0')}:00`;
      if (!ocupados.includes(s)) disponibles.push(s);
    }

    let creada = false;
    if (disponibles.length > 0) {
      const horaInicio = disponibles[__VU % disponibles.length];
      const [h] = horaInicio.split(':').map(Number);
      const horaFin = `${String(h + 1).padStart(2, '0')}:00`;

      const crearRes = http.post(
        `${BASE_URL}/citas`,
        JSON.stringify({
          paciente: data.pacienteId,
          doctor: doctor._id,
          fecha,
          horaInicio,
          horaFin,
          motivo: `Carga VU ${__VU}`,
        }),
        params
      );

      if (crearRes.status >= 200 && crearRes.status < 300) {
        creada = true;
      }
      check(crearRes, { 'cita creada': (r) => r.status >= 200 && r.status < 300 });
    }

    const misCitasRes = http.get(`${BASE_URL}/citas/mis-citas?limit=5`, params);
    check(misCitasRes, { 'mis citas 200': (r) => r.status === 200 });
  });

  sleep(1);
}
