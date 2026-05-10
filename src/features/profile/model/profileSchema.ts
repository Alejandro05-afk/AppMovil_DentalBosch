import { z } from 'zod';
import { birthDateSchema } from '@/shared/lib/formSchemas';

export const editProfileSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre es muy corto')
    .refine((val) => !/\d/.test(val), 'El nombre no puede contener números'),
  apellido: z
    .string()
    .min(2, 'El apellido es muy corto')
    .refine((val) => !/\d/.test(val), 'El apellido no puede contener números'),
  fechaNacimiento: birthDateSchema,
  genero: z.string().min(1, 'Selecciona un género'),
  telefono: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^\d+$/, 'Solo números'),
  direccion: z.object({
    calle: z.string().min(1, 'La calle es obligatoria'),
    ciudad: z
      .string()
      .min(1, 'La ciudad es obligatoria')
      .refine((val) => !/\d/.test(val), 'La ciudad no puede contener números'),
    provincia: z
      .string()
      .min(1, 'La provincia es obligatoria')
      .refine((val) => !/\d/.test(val), 'La provincia no puede contener números'),
  }),
  contactoEmergencia: z.object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .refine((val) => !/\d/.test(val), 'El nombre no puede contener números'),
    telefono: z
      .string()
      .min(1, 'El teléfono es obligatorio')
      .regex(/^\d+$/, 'Solo números'),
    parentesco: z.string().min(1, 'El parentesco es obligatorio'),
  }),
});

export type EditProfileFormData = z.infer<typeof editProfileSchema>;
