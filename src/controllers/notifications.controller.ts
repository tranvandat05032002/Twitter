import { NextFunction, Request, Response } from 'express'
import { TokenPayload } from '~/models/request/User.requests'
import { ParamsDictionary } from 'express-serve-static-core'
import databaseService from '~/services/database.services'
import { Pagination } from '~/models/request/Notify.request'
import notifyService from '~/services/notifications.services'
import { NOTIFY_MESSAGES } from '~/constants/message'

export const getListNotificationsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const notify = await notifyService.getListNotifications({
    user_id,
    limit,
    page
  })
  res.json({
    message: NOTIFY_MESSAGES.GET_USER_CHAT_SUCCESS,
    result: {
      notifications: notify.notifications,
      total: notify.total,
      limit,
      page,
      total_page: Math.ceil(notify.total / limit)
    }
  })
}
