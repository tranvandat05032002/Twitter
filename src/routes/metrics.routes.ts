import { Router } from "express";
import { metricCollectController } from "~/controllers/metrics.controller";

const metricsRouter = Router()
metricsRouter.get('/', metricCollectController)

export default metricsRouter