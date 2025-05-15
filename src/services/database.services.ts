import { MongoClient, Db, Collection } from 'mongodb'
import User from '~/models/schemas/User.chema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follow.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'
import Like from '~/models/schemas/Like.schema'
import Conversation from '~/models/schemas/Conversation'
import { envConfig } from '~/constants/config'
import Chat from '~/models/schemas/Chat.schema'
import Message from '~/models/schemas/Message.schema'
import Comment from '~/models/schemas/Comment.shcema'
const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@twitter.7p9fnva.mongodb.net/?retryWrites=true&w=majority`
class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(envConfig.dbName)
  }
  public async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
    }
  }
  async indexUser() {
    const exists = await this.users.indexExists(['email_1', 'email_1_password_1', 'username_1', 'name_text'])
    if (!exists) {
      this.users.createIndex({
        email: 1,
        password: 1
      })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
      this.users.createIndex(
        {
          name: 'text'
        },
        { default_language: 'none' }
      )
    }
  }
  async indexRefreshToken() {
    const exists = await this.RefreshTokens.indexExists(['exp_1', 'token_1'])
    if (!exists) {
      this.RefreshTokens.createIndex({
        token: 1
      })
      this.RefreshTokens.createIndex(
        {
          exp: 1
        },
        {
          expireAfterSeconds: 0
        }
      )
    }
  }
  async indexVideoStatus() {
    const exists = await this.videoStatus.indexExists(['name_1'])
    if (!exists) {
      this.videoStatus.createIndex({
        name: 1
      })
    }
  }
  async indexFollower() {
    const exists = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    if (!exists) {
      this.followers.createIndex({
        user_id: 1,
        followed_user_id: 1
      })
    }
  }
  async indexTweet() {
    const exists = await this.tweets.indexExists(['content_text'])
    if (!exists) {
      this.tweets.createIndex(
        {
          content: 'text'
        },
        { default_language: 'none' }
      )
    }
  }
  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUsersCollection as string)
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection(envConfig.dbTweetsCollection as string)
  }
  get RefreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokensCollection as string)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowersCollection as string)
  }
  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(envConfig.dbVideoStatusCollection as string)
  }
  get hashtags(): Collection<Hashtag> {
    return this.db.collection(envConfig.dbHashtagsCollection as string)
  }
  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(envConfig.dbBookmarksCollection as string)
  }
  get likes(): Collection<Like> {
    return this.db.collection(envConfig.dbLikesCollection as string)
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection(envConfig.dbConversationCollection as string)
  }
  get chats(): Collection<Chat> {
    return this.db.collection(envConfig.dbChatCollection as string)
  }
  get messages(): Collection<Message> {
    return this.db.collection(envConfig.dbMessageCollection as string)
  }
  get comments(): Collection<Comment> {
    return this.db.collection(envConfig.dbCommentCollection as string)
  }
}
const databaseService = new DatabaseService()
// databaseService.connect().catch(console.dir)
export default databaseService
