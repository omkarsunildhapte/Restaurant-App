import type { Request, Response } from 'express';
import { caller } from '@middleware/auth.middleware.js';
import { tenantService } from '@service/tenant/tenant.service.js';
import { HttpStatus } from '@type/utils/app-error.enum.js';
import {
  createTenantSchema,
  idParamSchema,
  listTenantsQuerySchema,
  tenantNotesSchema,
  updateSubscriptionSchema,
} from '@type/dto/tenant.dto.js';

export class AdminTenantController {
  /** POST /platform/v1/tenants: restaurant + first outlet + GST rates; owner added or invited. */
  public create = async (req: Request, res: Response): Promise<void> => {
    const dto = createTenantSchema.parse(req.body);
    res.status(HttpStatus.CREATED).json(await tenantService.create(caller(req).db, dto));
  };

  /** GET /platform/v1/admin/tenants?status=&q=: every restaurant, with outlet and staff counts. */
  public list = async (req: Request, res: Response): Promise<void> => {
    const query = listTenantsQuerySchema.parse(req.query);
    res.json(await tenantService.list(caller(req).db, query));
  };

  /** GET /platform/v1/admin/tenants/:id: subscription, features, outlets, people, invitations, notes. */
  public detail = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await tenantService.detail(caller(req).db, id));
  };

  /** PATCH /platform/v1/admin/tenants/:id: plan, status, trial end, feature switches. */
  public updateSubscription = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const dto = updateSubscriptionSchema.parse(req.body);
    res.json(await tenantService.updateSubscription(caller(req).db, id, dto));
  };

  /** PUT /platform/v1/admin/tenants/:id/notes: internal notes, Super Admin only. */
  public saveNotes = async (req: Request, res: Response): Promise<void> => {
    const { id } = idParamSchema.parse(req.params);
    const { notes } = tenantNotesSchema.parse(req.body);
    res.json(await tenantService.saveNotes(caller(req).db, id, notes));
  };
}

export const adminTenantController = new AdminTenantController();
