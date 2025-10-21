import { ObjectId } from 'mongodb'

type TAggregateType = 'tweets' | 'user' | 'notification'
type TAggregate = {
  type: TAggregateType
  id: ObjectId
} 
type TEventType = 'created' | 'updated' | 'deleted'
type TStatus = 'new' | 'dispatched' | 'failed'

interface IOutbox {
  _id?: ObjectId
  aggregate: TAggregate
  event_type: TEventType
  version: number
  occurred_at: Date;
  payload: any
  metadata?: Record<string, any>;
  status: TStatus
  retry_count: number
  error?: string | null;
  produced_at?: Date | null;

  created_by: ObjectId
  created_at?: Date
  updated_by?: ObjectId
  updated_at?: Date
  deleted_by?: ObjectId
  deleted_at?: Date
}

export default class Outbox {
  _id: ObjectId
  aggregate: TAggregate
  event_type: TEventType
  version: number
  occurred_at: Date
  payload: any // đã denormalize đủ cho ES
  metadata?: Record<string, any>
  status: TStatus
  retry_count: number
  error?: string
  headers?: Record<string, string>

  created_by?: ObjectId
  created_at?: Date
  updated_by?: ObjectId
  updated_at?: Date
  deleted_by?: ObjectId
  deleted_at?: Date

  constructor(data: IOutbox) {
    const date = new Date()

    this._id = data._id || new ObjectId()
    this.aggregate = data.aggregate
    this.event_type = data.event_type
    this.status = data.status
    this.version = data.version
    this.occurred_at = data.occurred_at
    this.retry_count = data.retry_count
    this.created_at = date || new Date()
    this.updated_at = date || new Date()
  }
}