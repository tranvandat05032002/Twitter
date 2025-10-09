import { esClient } from "..";

const TWEET_INDEX = "tweets_v1"
export const TWEET_ALIAS = "tweets"

export async function ensureIndex() {
  const exists = await esClient.indices.exists({ index: TWEET_INDEX })
  if (!exists) {
    await esClient.indices.create({
      index: TWEET_INDEX,
      // Có thể đọc settings và mappings từ file JSON
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        refresh_interval: "1s",
        analysis: {
          analyzer: {
            edge_ngram_analyzer: {
              type: "custom",
              tokenizer: "edge_ngram_tokenizer",
              filter: ["lowercase", "asciifolding"]
            }
          },
          tokenizer: {
            edge_ngram_tokenizer: {
              type: "edge_ngram",
              min_gram: 1,
              max_gram: 15,
              token_chars: ["letter", "digit"]
            }
          }
        }
      },
      mappings: {
        properties: {
          id: { type: "keyword" },
          user_id: { type: 'keyword', normalizer: 'lower_ascii' },
          type: { type: 'keyword' },
          audience: { type: 'keyword' },

          content: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword', ignore_above: 256 },
              suggest: { type: 'text', analyzer: 'edge_ngram_analyzer' }
            }
          },

          // hashtags: lưu id hashtag (string) hoặc slug
          hashtags: { type: 'keyword' },

          // mentions: lưu username hoặc user_id dạng string
          mentions: { type: 'keyword', normalizer: 'lower_ascii' },

          // medias: nếu cần truy vấn sâu từng media, chuyển sang nested
          medias: { type: 'keyword' },

          parent_id: { type: 'keyword' },
          guest_views: { type: 'long' },
          user_views: { type: 'long' },

          created_at: { type: 'date' },
          updated_at: { type: 'date' }
        }
      }
    })
  }

  const hasAlias = await esClient.indices.existsAlias({ name: TWEET_ALIAS })
  if (!hasAlias) {
    await esClient.indices.updateAliases({
      actions: [{ add: { index: TWEET_INDEX, alias: TWEET_ALIAS } }]
    })
  }
}