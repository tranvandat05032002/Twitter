import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
    clientId: 'user-service',
    brokers: ['localhost:29092'] // dùng 'kafka-broker:9092' nếu trong Docker Compose
});