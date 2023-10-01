import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/User.chema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follow.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Tweet.schema'
dotenv.config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.7p9fnva.mongodb.net/?retryWrites=true&w=majority`
class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
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
    const exists = await this.users.indexExists(['email_1', 'email_1_password_1', 'username_1'])
    if (!exists) {
      this.users.createIndex({
        email: 1,
        password: 1
      })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
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
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
  }
  get RefreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKEN_COLLECTION as string)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOW_COLLECTION as string)
  }
  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(process.env.DB_VIDEO_STATUS_COLLECTION as string)
  }
}
const databaseService = new DatabaseService()
// databaseService.connect().catch(console.dir)
export default databaseService
