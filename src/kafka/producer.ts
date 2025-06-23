import { kafka } from './index';
import { Partitioners } from 'kafkajs';

export const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
    retry: {
        retries: 3,
        initialRetryTime: 500
    }
});

export async function connectProducer() {
    await producer.connect();
}