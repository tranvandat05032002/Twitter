import { string } from 'node_modules/yaml/dist/schema/common/string'
import { esClient } from '..'
import { ESKeyStore, IndexDef } from '~/constants/es'

const defs: IndexDef[] = [
  {
    index: ESKeyStore.Tweet.index,
    alias: ESKeyStore.Tweet.alias,
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      refresh_interval: '1s',
      analysis: {
        normalizer: { lower_ascii: { type: 'custom', filter: ['lowercase', 'asciifolding'] } },
        analyzer: {
          edge_ngram_analyzer: {
            type: 'custom',
            tokenizer: 'edge_ngram_tokenizer',
            filter: ['lowercase', 'asciifolding']
          }
        },
        tokenizer: {
          edge_ngram_tokenizer: { type: 'edge_ngram', min_gram: 1, max_gram: 15, token_chars: ['letter', 'digit'] }
        }
      }
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        user_id: { type: 'keyword', normalizer: 'lower_ascii' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
        content: {
          type: 'text',
          fields: {
            keyword: { type: 'keyword', ignore_above: 256 },
            suggest: { type: 'text', analyzer: 'edge_ngram_analyzer' }
          }
        }
      }
    }
  }
  // push thêm các module khác ở đây...
]

let initPromise: Promise<void> | null = null

async function ensureOne(def: IndexDef) {
  const exists = await esClient.indices.exists({ index: def.index })
  if (!exists) {
    await esClient.indices.create({ index: def.index, settings: def.settings, mappings: def.mappings })
  }
  const hasAlias = await esClient.indices.existsAlias({ name: def.alias })
  if (!hasAlias) {
    await esClient.indices.updateAliases({ actions: [{ add: { index: def.index, alias: def.alias } }] })
  }
}

export function initSearch(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      for (const d of defs) {
        await ensureOne(d)
      }
    })()
  }
  return initPromise
}
