
type NotificationsModule = any;
let NotificationsModule: NotificationsModule | null = null;

const loadNotifications = async () => {
  if (!NotificationsModule) {
    const mod = await import('expo-notifications');
    NotificationsModule = mod.default ?? mod;
  }
};

export const localNotificationService = {
  /**
   * Programa un recordatorio local para una cita médica
   * @param citaId ID de la cita
   * @param fecha Fecha de la cita en formato YYYY-MM-DD
   * @param horaInicio Hora de inicio en formato HH:MM
   * @param pacienteNombre Nombre del paciente
   * @param doctorNombre Nombre del doctor
   * @param minutosAntes Minutos antes de la cita para enviar el recordatorio (default: 60)
   */
  scheduleAppointmentReminder: async (
    citaId: string,
    fecha: string,
    horaInicio: string,
    pacienteNombre: string,
    doctorNombre: string,
    minutosAntes: number = 60
  ): Promise<string | null> => {
    await loadNotifications();
    if (!NotificationsModule) return null;

    try {
      // Calcular la fecha y hora del recordatorio
      const [year, month, day] = fecha.split('-').map(Number);
      const [hour, minute] = horaInicio.split(':').map(Number);

      const citaDate = new Date(year, month - 1, day, hour, minute);
      const reminderDate = new Date(citaDate.getTime() - minutosAntes * 60 * 1000);

      // Validar que el recordatorio sea en el futuro
      if (reminderDate <= new Date()) {
        console.warn('localNotificationService: la fecha del recordatorio ya pasó');
        return null;
      }

      const trigger = {
        type: 'date' as const,
        date: reminderDate,
      };

      const notificationId = await NotificationsModule.scheduleNotificationAsync({
        content: {
          title: '⏰ Recordatorio de Cita',
          body: `Tienes una cita con ${doctorNombre} en ${minutosAntes} minutos (${horaInicio})`,
          data: {
            tipoEvento: 'RECORDATORIO_CITA',
            citaId,
            fecha,
            horaInicio,
          },
          sound: true,
          priority: NotificationsModule.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'appointments-alerts',
        },
        trigger,
      });

      console.log('localNotificationService: recordatorio programado', notificationId);
      return notificationId;
    } catch (error) {
      console.error('localNotificationService: error programando recordatorio', error);
      return null;
    }
  },

  /**
   * Cancela un recordatorio local por su ID
   */
  cancelNotification: async (notificationId: string): Promise<void> => {
    await loadNotifications();
    if (!NotificationsModule) return;

    try {
      await NotificationsModule.cancelScheduledNotificationAsync(notificationId);
      console.log('localNotificationService: notificación cancelada', notificationId);
    } catch (error) {
      console.error('localNotificationService: error cancelando notificación', error);
    }
  },

  /**
   * Cancela todos los recordatorios programados para una cita específica
   */
  cancelAllAppointmentReminders: async (citaId: string): Promise<void> => {
    await loadNotifications();
    if (!NotificationsModule) return;

    try {
      const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
      const toCancel = scheduled.filter(
        (notif: any) => notif.content.data?.citaId === citaId
      );

      for (const notif of toCancel) {
        await NotificationsModule.cancelScheduledNotificationAsync(notif.identifier);
      }

      console.log(`localNotificationService: ${toCancel.length} recordatorios cancelados para cita ${citaId}`);
    } catch (error) {
      console.error('localNotificationService: error cancelando recordatorios', error);
    }
  },

  /**
   * Obtiene todas las notificaciones programadas
   */
  getAllScheduledNotifications: async (): Promise<any[]> => {
    await loadNotifications();
    if (!NotificationsModule) return [];

    try {
      return await NotificationsModule.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('localNotificationService: error obteniendo notificaciones programadas', error);
      return [];
    }
  },
};
