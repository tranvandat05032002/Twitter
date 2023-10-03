import { ObjectId, WithId } from 'mongodb'
import databaseService from './database.services'
import Like from '~/models/schemas/Like.schema'

class LikeService {
  public async createTweetLike(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Like({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    return result.value as WithId<Like>
  }
  // public async removeTweetBookmark(user_id: string, tweet_id: string) {
  //   await databaseService.bookmarks.findOneAndDelete({
  //     user_id: new ObjectId(user_id),
  //     tweet_id: new ObjectId(tweet_id)
  //   })
  // }
  // public async removeBookmarkByBookmarkId(user_id: string, bookmark_id: string) {
  //   await databaseService.bookmarks.findOneAndDelete({
  //     _id: new ObjectId(bookmark_id),
  //     user_id: new ObjectId(user_id)
  //   })
  // }
}

const likeService = new LikeService()
export default likeService
