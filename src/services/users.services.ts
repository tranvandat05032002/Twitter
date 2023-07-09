import { User } from '~/models/schemas/User.chema'
import databaseService from './database.services'
import { IRegisterReqBody } from '~/models/request/User.requests'
import { hashPassword } from '~/utils/crypto'

class UsersService {
  public async register(payload: IRegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    return result
  }
  public async checkExistEmail(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}

const usersService = new UsersService()
export default usersService
