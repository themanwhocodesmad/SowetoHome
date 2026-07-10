import type { Request, Response } from 'express';
import type { ApplyHostInput, UpdateProfileInput } from '@soweto-stays/shared';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { ok } from '../../common/http/respond.js';
import { userService, toUserDto } from './user.service.js';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateProfileInput;
  const user = await userService.updateProfile(req.authUser!.id, input);
  ok(res, toUserDto(user));
});

export const applyToHost = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body as ApplyHostInput;
  const user = await userService.applyToHost(req.authUser!.id, message);
  ok(res, toUserDto(user));
});
