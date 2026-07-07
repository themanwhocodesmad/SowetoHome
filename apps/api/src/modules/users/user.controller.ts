import type { Request, Response } from 'express';
import type { UpdateProfileInput } from '@soweto-stays/shared';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok } from '../../common/http/respond.js';
import { userService, toUserDto } from './user.service.js';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateProfileInput;
  const user = await userService.updateProfile(req.authUser!.id, input);
  ok(res, toUserDto(user));
});

// Body only carries a { confirm: true } acknowledgement (validated by addHostRoleSchema) -
// the handler itself needs no fields from it, just the authenticated user's id.
export const becomeHost = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.addHostRole(req.authUser!.id);
  ok(res, toUserDto(user));
});
