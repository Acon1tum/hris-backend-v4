import { Request, Response } from 'express';
import { RoleType } from '@prisma/client';

export class RolesController {
  // List all available roles from the RoleType enum
  static async listRoles(req: Request, res: Response) {
    res.json({ success: true, data: Object.values(RoleType) });
  }
} 