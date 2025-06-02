import { Request, Response, NextFunction } from 'express';
import { httpRequestCount, httpRequestDuration } from '~/monitors/metricts';

export function prometheusMiddleware(req: Request, res: Response, next: NextFunction) {
    const end = httpRequestDuration.startTimer(); // start

    res.on('finish', () => {
        const labels = {
            method: req.method,
            route: req.route?.path || req.path,
            status_code: res.statusCode.toString()
        }

        httpRequestCount.labels(labels.method, labels.route, labels.status_code).inc();

        end(labels); // end
    });

    next()
}