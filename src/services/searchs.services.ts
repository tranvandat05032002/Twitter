import databaseService from './database.services'

class SearchService {
  async search({ limit, page, content }: { limit: number; page: number; content: string }) {
    const results = await databaseService.tweets
      .find({
        $text: { $search: content }
      })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()

    return results
  }
}

export const searchService = new SearchService()
