type ESKeyType = {
  index: string
  alias: string
}

export const ESKeyStore = {
  Tweet: { index: 'tweets_v2', alias: 'tweets_alias' },
} as const satisfies Record<string, ESKeyType>

export type IndexDef = {
  index: string
  alias: string
  settings: object
  mappings: object
}