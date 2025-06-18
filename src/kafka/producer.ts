import { kafka } from './index';
import { Partitioners } from 'kafkajs';

export const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
});

export async function connectProducer() {
    await producer.connect();
}