export interface OnboardingSlide {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  title: string;
  description: string;
}

export const PATIENT_SLIDES: OnboardingSlide[] = [
  {
    id: 'p1',
    icon: 'calendar-outline',
    iconBg: '#FFF0F7',
    iconColor: '#FF4FA3',
    accentColor: '#FF4FA3',
    title: 'Agenda tu cita en segundos',
    description:
      'Elige tu doctor preferido, selecciona el horario disponible y reserva tu cita odontológica sin llamadas ni esperas.',
  },
  {
    id: 'p2',
    icon: 'document-text-outline',
    iconBg: '#EBFFFD',
    iconColor: '#38D6C4',
    accentColor: '#38D6C4',
    title: 'Tu historial siempre contigo',
    description:
      'Consulta cada visita con su diagnóstico, tratamiento y prescripciones en una línea de tiempo clara e interactiva.',
  },
  {
    id: 'p3',
    icon: 'notifications-outline',
    iconBg: '#FFF0F7',
    iconColor: '#FF4FA3',
    accentColor: '#FF4FA3',
    title: 'Notificaciones al instante',
    description:
      'Recibe alertas cuando el doctor confirme o modifique tu cita. Nunca te perderás una actualización importante.',
  },
  {
    id: 'p4',
    icon: 'checkmark-circle-outline',
    iconBg: '#EBFFFD',
    iconColor: '#38D6C4',
    accentColor: '#38D6C4',
    title: '¡Todo listo para empezar!',
    description:
      'Tu salud dental es nuestra prioridad. Agenda tu primera cita y lleva el control de tu historial desde un solo lugar.',
  },
];

export const DOCTOR_SLIDES: OnboardingSlide[] = [
  {
    id: 'd1',
    icon: 'calendar-number-outline',
    iconBg: '#FFF0F7',
    iconColor: '#FF4FA3',
    accentColor: '#FF4FA3',
    title: 'Tu agenda, bajo control',
    description:
      'Visualiza todas tus citas del mes en un calendario interactivo. Consulta el detalle de cada paciente con un solo toque.',
  },
  {
    id: 'd2',
    icon: 'people-outline',
    iconBg: '#EBFFFD',
    iconColor: '#38D6C4',
    accentColor: '#38D6C4',
    title: 'Gestiona a tus pacientes',
    description:
      'Accede al listado de tus pacientes, busca por nombre o cédula y consulta la última consulta registrada de cada uno.',
  },
  {
    id: 'd3',
    icon: 'notifications-outline',
    iconBg: '#FFF0F7',
    iconColor: '#FF4FA3',
    accentColor: '#FF4FA3',
    title: 'Alertas de nuevas citas',
    description:
      'Recibe notificaciones push en tiempo real cuando un paciente agende o cancele una cita contigo. Siempre informado.',
  },
  {
    id: 'd4',
    icon: 'shield-checkmark-outline',
    iconBg: '#EBFFFD',
    iconColor: '#38D6C4',
    accentColor: '#38D6C4',
    title: '¡Listo para atender!',
    description:
      'Tu perfil profesional y horario de atención están configurados. Comienza a gestionar tu consultorio ahora mismo.',
  },
];