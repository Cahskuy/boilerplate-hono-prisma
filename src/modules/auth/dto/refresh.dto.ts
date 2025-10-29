import { z } from 'zod';
export const RefreshDto = z.object({ refreshToken: z.string().min(20) });
export type RefreshDto = z.infer<typeof RefreshDto>;
