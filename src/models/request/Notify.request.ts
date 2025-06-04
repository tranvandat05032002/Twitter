import { NotifyType } from "~/constants/enum"

export interface NotifyReqBody {
    sender_id: string
    receiver_id: string
    type: NotifyType
    is_sent: boolean | false
    message: string
    tweet_id: string | null
    comment_id: string | null
}