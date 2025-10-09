import { esClient } from ".."
import { TWEET_ALIAS } from "../indexer/tweet.index"

type PageOpts = {
  size?: number
  search_after?: any[] | null
  q?: string
  hashtags?: string[]
  exclude_replies?: boolean
  types?: Array<'tweet' | 'reply' | 'retweet' | 'quote'>
}

export async function esSearchMyTweetsPaged(userId: string, page: number, limit: number) {
  const from = Math.max(page - 1, 0) * limit;
  console.log("Running ES search My Tweets ----> ", { userId, page, limit, from })
  const res = await esClient.search({
    index: TWEET_ALIAS,
    from,
    size: limit,
    track_total_hits: true,
    sort: ['created_at:desc', '_id:asc'],
    query: { term: { user_id: userId } },
    _source: ['id', 'updated_at']
  });
  console.log("Response ES ---> ", res)
  const hits = res.hits.hits;
  const ids = hits.map((h: any) => (h._source?.id ?? h._id) as string);

  // map phiên bản (dựa vào updated_at) để phát hiện stale
  const versions = new Map<string, string | undefined>(
    hits.map((h: any) => {
      const id = (h._source?.id ?? h._id) as string;
      return [id, (h._source as any)?.updated_at];
    })
  );

  const total = typeof res.hits.total === 'object' ? res.hits.total.value : (res.hits.total as number);
  return { ids, total, versions };
}


export async function searchPublicTimeline(opts: PageOpts = {}) {
  const size = Math.min(Math.max(opts.size ?? 20, 1), 100)

  const must: any[] = []
  const filter: any[] = [{ terms: { audience: ['public'] } }]

  if (opts.q && opts.q.trim()) {
    must.push({
      multi_match: {
        query: opts.q.trim(),
        fields: ['content^3']
      }
    })
  } else {
    must.push({ match_all: {} })
  }

  if (opts.hashtags?.length) {
    filter.push({ terms: { hashtags: opts.hashtags } })
  }

  if (opts.exclude_replies) {
    filter.push({ bool: { must_not: { term: { type: 'reply' } } } })
  }

  if (opts.types?.length) {
    filter.push({ terms: { type: opts.types } })
  }

  const res = await esClient.search({
    index: TWEET_ALIAS,
    size,
    sort: ['created_at:desc', '_id:asc'],
    search_after: opts.search_after ?? undefined,
    query: { bool: { must, filter } },
    _source: {
      includes: [
        'id',
        'user_id',
        'type',
        'audience',
        'content',
        'hashtags',
        'mentions',
        'medias',
        'guest_views',
        'user_views',
        'created_at',
        'updated_at',
        'parent_id'
      ]
    },
    highlight: opts.q ? { fields: { content: {} } } : undefined
  })

  const hits = res.hits.hits.map((h) => ({
    id: h._id || (h._source as any)?.id,
    sort: (h as any).sort,
    score: h._score,
    source: h._source,
    highlight: (h as any).highlight
  }))

  return {
    items: hits.map((h) => h.source),
    next_search_after: hits.length ? hits[hits.length - 1].sort : null
  }
}

/** 1) Tweet của TÔI */
export async function searchMyTweets(userId: string, opts: PageOpts = {}) {
  const size = Math.min(Math.max(opts.size ?? 20, 1), 100);

  const must: any[] = [{ term: { user_id: userId } }];
  const filter: any[] = [];

  if (opts.q && opts.q.trim()) {
    must.push({ multi_match: { query: opts.q.trim(), fields: ['content^3'] } });
  }
  if (opts.hashtags?.length) filter.push({ terms: { hashtags: opts.hashtags } });
  if (opts.exclude_replies) filter.push({ bool: { must_not: { term: { type: 'reply' } } } });
  if (opts.types?.length) filter.push({ terms: { type: opts.types } });

  const res = await esClient.search({
    index: TWEET_ALIAS,
    size,
    sort: ['created_at:desc', '_id:asc'],
    search_after: opts.search_after ?? undefined,
    query: { bool: { must, filter } },
    _source: {
      includes: [
        'id',
        'user_id',
        'type',
        'audience',
        'content',
        'hashtags',
        'mentions',
        'medias',
        'guest_views',
        'user_views',
        'created_at',
        'updated_at',
        'parent_id'
      ]
    }
  });

  const hits = res.hits.hits.map((h) => ({
    id: h._id || (h._source as any)?.id,
    sort: (h as any).sort,
    source: h._source
  }));

  return {
    items: hits.map((h) => h.source),
    next_search_after: hits.length ? hits[hits.length - 1].sort : null
  };
}

/** Helper: parse search_after từ query (?sa=base64 hoặc JSON) */
export function parseSearchAfter(sa?: string | null): any[] | null {
  if (!sa) return null;
  try {
    // chấp nhận chuỗi JSON hoặc base64(JSON)
    if (sa.startsWith('[')) return JSON.parse(sa);
    const decoded = Buffer.from(sa, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/** Helper: encode search_after để trả về cho client */
export function encodeSearchAfter(sortArray: any[] | null): string | null {
  if (!sortArray) return null;
  try {
    return Buffer.from(JSON.stringify(sortArray)).toString('base64');
  } catch {
    return null;
  }
}