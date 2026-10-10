import type { Request, Response } from 'express';
import { attribution, reverse, search } from '@service/geocode/geocode.service.js';
import { reverseQuerySchema, searchQuerySchema } from '@type/dto/geocode.dto.js';

export class BusinessGeocodeController {
  /** GET /geocode/search?q=: address → places (searched on submit, never as you type). */
  public search = async (req: Request, res: Response): Promise<void> => {
    const { q } = searchQuerySchema.parse(req.query);
    res.json({ results: await search(q), attribution });
  };

  /** GET /geocode/reverse?lat=&lng=: position → nearest address, or null. */
  public reverse = async (req: Request, res: Response): Promise<void> => {
    const { lat, lng } = reverseQuerySchema.parse(req.query);
    res.json({ result: await reverse(lat, lng), attribution });
  };
}

export const businessGeocodeController = new BusinessGeocodeController();
