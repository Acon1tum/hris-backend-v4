import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomError } from '@/shared/middleware/error-handler';

const prisma = new PrismaClient();

export class AuditLogsController {
  // List audit logs with optional filters
  static async listLogs(req: Request, res: Response) {
    const { user_id, action_type, table_affected, date_from, date_to, record_id } = req.query;
    const where: any = {};
    if (user_id) where.user_id = user_id;
    if (action_type) where.action_type = action_type;
    if (table_affected) where.table_affected = table_affected;
    if (record_id) where.record_id = record_id;
    if (date_from || date_to) {
      where.timestamp = {};
      if (date_from) where.timestamp.gte = new Date(date_from as string);
      if (date_to) where.timestamp.lte = new Date(date_to as string);
    }
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { id: true, username: true, email: true } } }
    });
    res.json({ success: true, data: logs });
  }

  // Get audit log by ID
  static async getLog(req: Request, res: Response) {
    const { id } = req.params;
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, email: true } } }
    });
    if (!log) throw new CustomError('Audit log not found', 404);
    res.json({ success: true, data: log });
  }
} 