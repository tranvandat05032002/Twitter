import { Kafka, logLevel } from 'kafkajs';

export const kafka = new Kafka({
    clientId: 'user-service',
    brokers: ['localhost:29092'], // dùng 'kafka-broker:9092' nếu trong Docker Compose
    connectionTimeout: 4000,
    requestTimeout: 25000,
    logLevel: logLevel.INFO,
    retry: {
        retries: 3,
        initialRetryTime: 300,  // (ms) retry lần đầu sau 300ms
        factor: 0.2,            // tăng dần theo hàm exp: backoff = prev * (1 + factor)
        multiplier: 2,          // backoff *= multiplier mỗi lần
        maxRetryTime: 30000
    }
});