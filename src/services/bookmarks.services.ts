import { ObjectId, WithId } from 'mongodb'
import databaseService from './database.services'
import Bookmark from '~/models/schemas/Bookmark.schema'

class BookmarkService {
  public async createTweetBookmark(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    return result.value as WithId<Bookmark>
  }
  public async removeTweetBookmark(user_id: string, tweet_id: string) {
    await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
  }
  public async removeBookmarkByBookmarkId(user_id: string, bookmark_id: string) {
    await databaseService.bookmarks.findOneAndDelete({
      _id: new ObjectId(bookmark_id),
      user_id: new ObjectId(user_id)
    })
  }
}
const bookmarkService = new BookmarkService()
export default bookmarkService
