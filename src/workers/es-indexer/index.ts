import { ObjectId } from "mongodb";
import { producer } from "~/kafka/producer";
import databaseService from "~/services/database.services";

// 1) Bảng routing đa module (có thể lấy từ .env / DB)
const ROUTES: Record<string, Record<string, string>> = {
  // aggregate.type -> event_type -> topic
  tweets: {
    CREATED: "tweet-created",
    UPDATED: "tweet-updated",
    DELETED: "tweet-deleted"
  },
  user: {
    CREATED: "user-created",
    UPDATED: "user-updated",
    DELETED: "user-deleted"
  },
  notification: {
    CREATED: "notification-created",
    UPDATED: "notification-updated",
    DELETED: "notification-deleted"
  }
};

// 2) Một số tham số điều khiển
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE ?? 500);
const IDLE_MS = Number(process.env.OUTBOX_IDLE_MS ?? 400);
const WORKERS = Number(process.env.OUTBOX_WORKERS ?? 4);
const MAX_RETRY = Number(process.env.OUTBOX_MAX_RETRY ?? 10);

type OutboxDoc = {
  _id: ObjectId;
  aggregate: { type: string; id: ObjectId | string };
  event_type: "CREATED" | "UPDATED" | "DELETED";
  occurred_at: Date;
  version: number;
  payload: any;
  status: "NEW" | "IN_PROGRESS" | "DISPATCHED" | "FAILED";
  retry_count: number;
  produced_at?: Date | null;
  error?: string | null;
  metadata?: Record<string, any>;
};

// 3) Build record Kafka đa module
function toKafkaRecord(ev: OutboxDoc) {
  const moduleType = ev.aggregate.type;
  const topic = ROUTES[moduleType]?.[ev.event_type];
  if (!topic) return null;

  return {
    topic,
    messages: [
      {
        // Bảo đảm ordering theo entity
        key: String(ev.aggregate.id ?? ev._id),
        value: JSON.stringify({
          aggregate: ev.aggregate,
          payload: ev.payload,
          version: ev.version,
          occurred_at: ev.occurred_at
        }),
        headers: {
          "x-aggregate-type": moduleType,
          "x-event-type": ev.event_type,
          "x-schema": Buffer.from("v1") // nếu muốn version schema
        }
      }
    ]
  };
}

async function run() {
  const m = await databaseService.getClientInstance();
  const outbox = m.db().collection<OutboxDoc>("outbox_events");
  // Worker “claim + publish”
  async function workerLoop(i: number) {

    // mỗi worker loop vô hạn
    // pattern: claim N bản ghi NEW -> chuyển IN_PROGRESS -> push Kafka -> set DISPATCHED
    while (true) {
      // 3.1) Claim batch: atomically NEW -> IN_PROGRESS (kèm marker worker_id để debug)
      // dùng findOneAndUpdate nhiều lần cho đến khi đủ batch (tránh scan toArray)
      const claimed: OutboxDoc[] = [];
      for (let k = 0; k < BATCH_SIZE; k++) {
        const res = await outbox.findOneAndUpdate(
          { status: "NEW" },
          {
            $set: {
              status: "IN_PROGRESS",
              // optional: đánh dấu ai claim để theo dõi
              "metadata.claimed_by": `relay-${i}`,
              "metadata.claimed_at": new Date()
            }
          },
          {
            sort: { occurred_at: 1, _id: 1 },
            returnDocument: "after"
          }
        );
        if (!res.value) break;
        claimed.push(res.value);
      }

      if (!claimed.length) {
        await new Promise((r) => setTimeout(r, IDLE_MS));
        continue;
      }

      // 3.2) Gom records theo topic để sendBatch
      const byTopic: Record<string, { topic: string; messages: any[] }> = {};
      for (const ev of claimed) {
        const entry = toKafkaRecord(ev);
        if (!entry) {
          // không có route → FAIL luôn để xem lại cấu hình
          await outbox.updateOne(
            { _id: ev._id },
            {
              $set: {
                status: "FAILED",
                error: `No route for ${ev.aggregate.type}:${ev.event_type}`
              }
            }
          );
          continue;
        }
        if (!byTopic[entry.topic]) byTopic[entry.topic] = { topic: entry.topic, messages: [] };
        byTopic[entry.topic].messages.push(entry.messages[0]);
      }

      const batches = Object.values(byTopic);
      // 3.3) Gửi theo topic bằng sendBatch (tối ưu throughput)
      try {
        if (batches.length) {
          await producer.sendBatch({ topicMessages: batches });
        }

        // 3.4) Mark DISPATCHED
        const ids = claimed.map((c) => c._id);
        if (ids.length) {
          await outbox.updateMany(
            { _id: { $in: ids }, status: "IN_PROGRESS" },
            { $set: { status: "DISPATCHED", produced_at: new Date(), error: null } }
          );
        }
      } catch (err: any) {

        // 3.5) Gắn retry / chuyển FAILED nếu quá ngưỡng
        await Promise.allSettled(
          claimed.map((ev) => {
            const retry = (ev.retry_count ?? 0) + 1;
            const update: any = {
              $set: { error: String(err) },
              $inc: { retry_count: 1 }
            };
            if (retry >= MAX_RETRY) update.$set.status = "FAILED";
            else update.$set.status = "NEW"; // trả về NEW để worker khác thử lại

            return outbox.updateOne({ _id: ev._id }, update);
          })
        );
      }
    }
  }

  // chạy nhiều worker song song (scale ngang được bằng tăng replica)
  await Promise.all(Array.from({ length: WORKERS }, (_, i) => workerLoop(i)));
}

run().catch((e) => {
  process.exit(1);
});
