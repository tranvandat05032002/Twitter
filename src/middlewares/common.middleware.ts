import { Request, Response, NextFunction } from 'express'
import { pick } from 'lodash'
type FilterKey<T> = (keyof T)[] 
export const filterMiddleWare = <T>(filterKeys: FilterKey<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }
}
