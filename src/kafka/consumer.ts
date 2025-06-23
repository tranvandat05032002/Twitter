import { Consumer } from "kafkajs";
import { redisKey } from "~/utils/cacheKey";
import { getCache } from "~/utils/redisRead";
import { setCache } from "~/utils/redisWrite";
import { kafka } from "./index";
import lodash from "lodash"

const consumer = kafka.consumer({
    groupId: 'cache-group',
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    retry: {
        retries: 5,
        initialRetryTime: 500,
        multiplier: 2,
        maxRetryTime: 60000
    }
});

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
        autoCommit: false,
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            try {
                if (!message.value) return;
                const { user_id, data } = JSON.parse(message.value.toString());

                await heartbeat()   // Giữ kết nối broker khi timeout hoặc crash

                const processedAt = await getCache(redisKey.userMeUpdated(user_id));
                if (processedAt === data.updated_at) {
                    return;
                }

                const oldCache = await getCache(redisKey.userMe(user_id));

                const cleanedOld = removeFields(oldCache, ['updated_at', 'last_online']);
                const cleanedNew = removeFields(data, ['updated_at', 'last_online']);

                const isSame = lodash.isEqual(cleanedOld, cleanedNew);

                if (isSame) {
                    return;
                }

                await setCache(redisKey.userMe(user_id), data, 60 * 60 * 24); // TTL: 1 ngày
                await setCache(redisKey.userMeUpdated(user_id), data.updated_at, 60 * 60 * 24 * 3); // TTL: 3 ngày

                // Commit offset sau khi hoàn thành
                await consumer.commitOffsets([
                    {
                        topic,
                        partition,
                        offset: (Number(message.offset) + 1).toString()
                    }
                ]);

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