import { Request } from "express";
import { User } from "./models/schemas/User.chema";
declare module 'express' {
  interface Request {
    user?: User
  }
}