import { TweetReqBody } from '~/models/request/Tweet.request'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId } from 'mongodb'

class TweetService {
  public async createTweet(body: TweetReqBody, user_id: string) {
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        type: body.type,
        content: body.content,
        audience: body.audience,
        hashtags: [], // chua xu ly
        medias: body.medias,
        parent_id: body.parent_id,
        user_id: new ObjectId(user_id),
        mentions: body.mentions
      })
    )
    const tweet = await databaseService.tweets.findOne({
      _id: result.insertedId
    })
    return tweet
  }
}
const tweetService = new TweetService()
export default tweetService
