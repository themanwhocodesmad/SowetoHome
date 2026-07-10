import { z } from 'zod';

// Body of POST /api/auth/google - the "credential" is the Google ID token (a JWT) that
// Google Identity Services hands the browser after the user clicks the sign-in button.
export const googleSignInSchema = z.object({
  credential: z.string().min(1, 'credential is required'),
});
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;
