import { ESKeyStore } from '~/constants/es'
import { esClient } from '..'
import { SortCombinations } from 'node_modules/@elastic/elasticsearch/lib/api/types'

type EsIdsPage = {
  ids: string[]
  total: number // giữ như cũ
  versions: Map<string, string | undefined>
}

type PageOpts = {
  size?: number
  search_after?: any[] | null
  q?: string
  hashtags?: string[]
  exclude_replies?: boolean
  types?: Array<'tweet' | 'reply' | 'retweet' | 'quote'>
}

export async function esSearchMyTweetsPaged(userId: string, page: number, limit: number): Promise<EsIdsPage> {
  const from = Math.max(page - 1, 0) * limit
  // const size = Math.max(1, Math.min(limit, 1000))
  // const steps = Math.max(page - 1, 0)

  // const SORT: SortCombinations[] = [
  //   { created_at: { order: 'desc', unmapped_type: 'date', missing: '_last' } },
  //   { id: { order: 'asc', unmapped_type: 'keyword' } }
  // ]

  // const tGlobalStart = process.hrtime.bigint()

  // // 1️⃣ Đếm tổng
  // const tCountStart = process.hrtime.bigint()

  // // Đếm tổng (1 lần mỗi request) để giữ nguyên cấu trúc res.total
  // const countRes = await esClient.count({
  //   index: ESKeyStore.Tweet.alias,
  //   query: { term: { user_id: { value: userId } } }
  // })
  // const tCountEnd = process.hrtime.bigint()

  // // Mở PIT
  // const tPitStart = process.hrtime.bigint()
  // const pit = await esClient.openPointInTime({
  //   index: ESKeyStore.Tweet.alias,
  //   keep_alive: '1m'
  // })
  // const tPitEnd = process.hrtime.bigint()

  // let sortAfter: any[] | undefined = undefined
  // let lastPageHits: any[] = []

  // try {
  //   for (let i = 0; i <= steps; i++) {
  //     const tSearchStart = process.hrtime.bigint()
  //     const res = await esClient.search({
  //       pit: { id: pit.id, keep_alive: '2m' },
  //       size,
  //       sort: SORT,
  //       track_total_hits: false, // nhanh
  //       ...(sortAfter ? { search_after: sortAfter } : {}),
  //       query: { bool: { filter: [{ term: { user_id: { value: userId } } }] } },
  //       _source: ['id', 'updated_at', 'created_at']
  //     })

  //     const tSearchEnd = process.hrtime.bigint()

  //     const hits = res.hits?.hits ?? []
  //     lastPageHits = hits

  //     // chuẩn bị cursor cho vòng tiếp theo
  //     const last = hits.at(-1)
  //     sortAfter = last?.sort as any[] | undefined

  // console.log(
  //   `[ES-SEARCH] Page=${i + 1} took=${(res as any).took}ms | RTT=${(
  //     Number(tSearchEnd - tSearchStart) / 1e6
  //   ).toFixed(1)}ms | hits=${hits.length}`
  // )
  //     // nếu đã hết dữ liệu trước khi tới trang mục tiêu -> break sớm
  //     if (!hits.length && i < steps) break
  //   }
  // } finally {
  //   // Đóng PIT (best-effort)
  //   const tCloseStart = process.hrtime.bigint()
  //   try {
  //     await esClient.closePointInTime({ id: pit.id })
  //   } catch {
  //     /* empty */
  //   }
  //   const tCloseEnd = process.hrtime.bigint()
  //   const tGlobalEnd = process.hrtime.bigint()
  //   console.log(
  //     `[ES-COUNT][Summary] Count=${(Number(tCountEnd - tCountStart) / 1e6).toFixed(1)}ms | PIT-open=${(
  //       Number(tPitEnd - tPitStart) / 1e6
  //     ).toFixed(1)}ms | PIT-close=${(Number(tCloseEnd - tCloseStart) / 1e6).toFixed(1)}ms | TOTAL=${(
  //       Number(tGlobalEnd - tGlobalStart) / 1e6
  //     ).toFixed(1)}ms`
  //   )
  // }

  // const ids = lastPageHits.map((h: any) => (h._source?.id ?? h._id) as string)
  // const versions = new Map<string, string | undefined>(
  //   lastPageHits.map((h: any) => {
  //     const id = (h._source?.id ?? h._id) as string
  //     return [id, (h._source as any)?.updated_at]
  //   })
  // )

  // return {
  //   ids,
  //   total: countRes.count,
  //   versions
  // }

  try {
    const tSearchStart = process.hrtime.bigint()
    const res = await esClient.search({
      index: ESKeyStore.Tweet.alias,
      from,
      size: limit,
      track_total_hits: false,
      // track_total_hits: true,
      query: {
        bool: {
          filter: [{ term: { user_id: { value: userId } } }]
        }
      },
      sort: [
        { created_at: { order: 'desc', unmapped_type: 'date', missing: '_last' } },
        { id: { order: 'asc', unmapped_type: 'keyword' } }
      ],
      // nếu mapping của user_id là keyword => nên dùng value:
      // query: { term: { user_id: { value: userId } } },
      _source: ['id', 'updated_at', 'created_at']
    })
    const hits = res.hits?.hits ?? []
    // console.log(
    //   `[ES-SEARCH] Page=${page} took=${(res as any).took}ms | RTT=${(Number(tSearchEnd - tSearchStart) / 1e6).toFixed(
    //     1
    //   )}ms | hits=${hits.length}`
    // )
    const ids = hits.map((h: any) => (h._source?.id ?? h._id) as string)

    const versions = new Map<string, string | undefined>(
      hits.map((h: any) => {
        const id = (h._source?.id ?? h._id) as string
        return [id, (h._source as any)?.updated_at]
      })
    )

    const total = typeof res.hits.total === 'object' ? res.hits.total.value : (res.hits.total as number)
    const tSearchEnd = process.hrtime.bigint()
    console.log(
      `[ES-SEARCH] Page=${page} took=${(res as any).took}ms | RTT=${(Number(tSearchEnd - tSearchStart) / 1e6).toFixed(
        1
      )}ms | hits=${hits.length}`
    )
    return { ids, total, versions }
  } catch (err: any) {
    // log chi tiết lỗi từ elasticsearch-js
    const meta = err?.meta || err?.meta?.body ? err.meta : undefined
    console.error('ES search error:', err?.message, meta?.body || meta || err)
    throw err // hoặc return { ids: [], total: 0, versions: new Map() } để lên trên biết là ES fail
  }
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
    index: ESKeyStore.Tweet.alias,
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
  const size = Math.min(Math.max(opts.size ?? 20, 1), 100)

  const must: any[] = [{ term: { user_id: userId } }]
  const filter: any[] = []

  if (opts.q && opts.q.trim()) {
    must.push({ multi_match: { query: opts.q.trim(), fields: ['content^3'] } })
  }
  if (opts.hashtags?.length) filter.push({ terms: { hashtags: opts.hashtags } })
  if (opts.exclude_replies) filter.push({ bool: { must_not: { term: { type: 'reply' } } } })
  if (opts.types?.length) filter.push({ terms: { type: opts.types } })

  const res = await esClient.search({
    index: ESKeyStore.Tweet.alias,
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
  })

  const hits = res.hits.hits.map((h) => ({
    id: h._id || (h._source as any)?.id,
    sort: (h as any).sort,
    source: h._source
  }))

  return {
    items: hits.map((h) => h.source),
    next_search_after: hits.length ? hits[hits.length - 1].sort : null
  }
}

/** Helper: parse search_after từ query (?sa=base64 hoặc JSON) */
export function parseSearchAfter(sa?: string | null): any[] | null {
  if (!sa) return null
  try {
    // chấp nhận chuỗi JSON hoặc base64(JSON)
    if (sa.startsWith('[')) return JSON.parse(sa)
    const decoded = Buffer.from(sa, 'base64').toString('utf8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/** Helper: encode search_after để trả về cho client */
export function encodeSearchAfter(sortArray: any[] | null): string | null {
  if (!sortArray) return null
  try {
    return Buffer.from(JSON.stringify(sortArray)).toString('base64')
  } catch {
    return null
  }
}
