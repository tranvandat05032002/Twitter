import { Kafka, Partitioners } from "kafkajs";
import User from "~/models/schemas/User.chema";
import { producer } from "./producer";


export async function publishUserUpdated({ user_id, userData }: { user_id: string, userData: User }) {
    await producer.send({
        topic: 'user-updated',
        messages: [
            {
                key: user_id,
                value: JSON.stringify({
                    user_id,
                    data: userData
                })
            }
        ]
    });
}
