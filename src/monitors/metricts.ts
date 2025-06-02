import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client'

// Initial Registry
const register = new Registry()

// Collect metrics (CPU, memory, event loop,...)
collectDefaultMetrics({ register })

// Measure request response time ---> http_request_duration_second
export const httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Thời gian phản hồi HTTP",
    labelNames: ["method", "route", "status_code"] as const,
    buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5] // seconds
})

// Count total request
export const httpRequestCount = new Counter({
    name: "http_requests_total",
    help: "Tổng số request",
    labelNames: ["method", "route", "status_code"] as const
})

register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestCount)

export { register }