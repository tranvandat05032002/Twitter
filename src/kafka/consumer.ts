import { Consumer } from "kafkajs";
import { redisKey } from "~/utils/cacheKey";
import { getCache } from "~/utils/redisRead";
import { setCache } from "~/utils/redisWrite";
import { kafka } from "./index";

const consumer = kafka.consumer({ groupId: 'cache-group' });

async function retryConnect(consumer: Consumer, retries = 5) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            await consumer.connect();
            console.log("✅ Kafka consumer connected");
            return;
        } catch (err) {
            attempt++;
            const waitTime = 1000 * Math.pow(2, attempt); // Exponential backoff
            console.warn(`❌ Kafka connect failed (attempt ${attempt}), retrying in ${waitTime}ms`);
            await new Promise(res => setTimeout(res, waitTime));
        }
    }
    throw new Error("❌ Failed to connect Kafka consumer after retries");
}

export async function startConsumer() {
    await retryConnect(consumer);
    await consumer.subscribe({ topic: 'user-updated', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            try {
                if (!message.value) return;
                const { user_id, data } = JSON.parse(message.value.toString());
                const oldCache = await getCache(redisKey.userMe(user_id));

                const cleanedOld = removeFields(oldCache, ['updated_at', 'last_online']);
                const cleanedNew = removeFields(data, ['updated_at', 'last_online']);

                const isSame = JSON.stringify(cleanedOld) === JSON.stringify(cleanedNew);

                if (isSame) {
                    return;
                }

                await setCache(redisKey.userMe(user_id), data, 600);
            } catch (error) {
                console.error('❌ Failed to process message:', error);
            }
        }
    });
}

function removeFields(obj: any, fields: string[]) {
    const result = { ...obj };
    for (const f of fields) delete result[f];
    return result;
}