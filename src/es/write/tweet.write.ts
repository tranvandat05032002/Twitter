import Tweet from "~/models/schemas/Tweet.schema";
import { esClient } from "..";
import { TWEET_ALIAS } from "../indexer/tweet.index";
import { TweetAudience, TweetType } from "~/constants/enum";

export type TweetDocES = {
  id: string;
  user_id: string;
  type: TweetType;
  audience: TweetAudience;
  content: string;
  parent_id?: string | null;
  hashtags?: string[];
  mentions?: string[];
  medias?: string[];
  guest_views?: number;
  user_views?: number;
  created_at: string;    // ISO
  updated_at: string;    // ISO
};
export function mapMongoTweetToES(t: any): TweetDocES {
  return {
    id: String(t._id),
    user_id: String(t.user_id),
    type: t.type,
    audience: t.audience,
    content: t.content,
    parent_id: t.parent_id ? String(t.parent_id) : undefined,
    hashtags: (t.hashtags || []).map((h: any) => String(h._id ?? h)),
    mentions: (t.mentions || []).map((m: any) => String(m._id ?? m)),
    medias: t.medias || [],
    guest_views: t.guest_views ?? 0,
    user_views: t.user_views ?? 0,
    created_at: new Date(t.created_at).toISOString(),
    updated_at: new Date(t.updated_at).toISOString()
  };
}

/** Write-behind: upsert hàng loạt vào ES (không chặn request) */
export async function bulkIndexTweets(docs: TweetDocES[]) {
  if (!docs.length) return;
  const ops = docs.flatMap(d => ([
    { index: { _index: TWEET_ALIAS, _id: d.id } },
    d
  ]));
  const res = await esClient.bulk({ operations: ops, refresh: false });
  if (res.errors) {
    const errs = (res.items || []).filter((i: any) => i.index?.error).slice(0, 5);
    console.error('ES bulk upsert errors (first 5):', errs);
  }
}

/** Tuỳ chọn: xoá khỏi ES các id không còn tồn tại ở DB (nếu bạn muốn) */
export async function bulkDeleteTweetsByIds(ids: string[]) {
  if (!ids.length) return;
  const ops = ids.flatMap(id => [{ delete: { _index: TWEET_ALIAS, _id: id } }]);
  const res = await esClient.bulk({ operations: ops, refresh: false });
  if (res.errors) {
    const errs = (res.items || []).filter((i: any) => i.delete?.error).slice(0, 5);
    console.error('ES bulk delete errors (first 5):', errs);
  }
}


export async function indexTweet(tweet: Tweet) {
  const now = new Date().toString()
  const body = {
    ...tweet,
    parent_id: tweet.parent_id ?? undefined,
    hashtags: tweet.hashtags ?? [],
    mentions: tweet.mentions ?? [],
    medias: tweet.medias ?? [],
    guest_views: tweet.guest_views ?? 0,
    user_views: tweet.user_views ?? 0,
    created_at: tweet.created_at ?? now,
    updated_at: tweet.updated_at ?? now
  }
  return esClient.index({
    index: TWEET_ALIAS,
    id: tweet._id?.toString(),
    document: body,
    refresh: "wait_for"
  })
}
