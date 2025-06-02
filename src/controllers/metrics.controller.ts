import { Request, Response } from 'express';
import { register } from '~/monitors/metricts';
export const metricCollectController = async (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics())
}

