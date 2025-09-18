export const redisKey = {
  userMe: (userId: string) => `user:me:${userId}`,
  userMeUpdated: (userId: string) => `user:me:updated:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  lockLogin: (userId: string) => `lock:login:${userId}`,
  lockOnce: (userId: string) => `lock:once:${userId}`,
  loginIp: (ip: string) => `rl:login:ip:${ip}`,
  loginToken: (token: string) => `rl:login:token:${token}`
}