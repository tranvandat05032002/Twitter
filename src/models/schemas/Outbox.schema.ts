import { ObjectId } from 'mongodb'

type TAggregateTypeLow = 'tweets' | 'user' | 'notification'
type TAggregateTypeUp = 'TWEETS' | 'USERS' | 'NOTIFICATIONS'
type TEventType = 'UPSERTED' | 'BACKFILL' | 'DELETED'
type TStatus = 'pending' | 'processing' | 'sent' | 'error'

interface IOutbox {
  _id?: ObjectId
  aggregate_type_low: TAggregateTypeLow
  aggregate_type_up: TAggregateTypeUp
  aggregate_id: ObjectId
  aggregate_version: number
  event_id: string
  event_type: TEventType
  payload: any // đã denormalize đủ cho ES
  headers?: Record<string, string>
  status: TStatus
  attempts: number
  available_at: Date

  created_by: ObjectId
  created_at?: Date
  updated_by?: ObjectId
  updated_at?: Date
  deleted_by?: ObjectId
  deleted_at?: Date
}

class Outbox {
  _id?: ObjectId
  aggregate_type_low: TAggregateTypeLow
  aggregate_type_up: TAggregateTypeUp
  aggregate_id: ObjectId
  aggregate_version: number
  event_id: string
  event_type: TEventType
  payload: any // đã denormalize đủ cho ES
  headers?: Record<string, string>
  status: TStatus
  attempts: number
  available_at: Date

  created_by?: ObjectId
  created_at?: Date
  updated_by?: ObjectId
  updated_at?: Date
  deleted_by?: ObjectId
  deleted_at?: Date

  constructor(outbox: IOutbox) {
    const date = new Date()
    this._id = outbox._id
    this.aggregate_type_low = outbox.aggregate_type_low
    this.aggregate_type_up = outbox.aggregate_type_up
    this.aggregate_id = outbox.aggregate_id
    this.aggregate_version = outbox.aggregate_version
    this.event_id = outbox.event_id
    this.event_type = outbox.event_type
    this.status = outbox.status
    this.attempts = outbox.attempts
    this.available_at = date || new Date()
    this.created_at = date || new Date()
    this.updated_at = date || new Date()
  }
}

export default Outbox
