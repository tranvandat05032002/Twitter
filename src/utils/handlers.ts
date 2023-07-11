import Express from 'express'
export default function wrapRequestHandler (Func: Express.RequestHandler) {
  return async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
      await Func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
