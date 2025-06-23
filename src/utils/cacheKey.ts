export const redisKey = {
    userMe: (userId: string) => `user:me:${userId}`,
    userMeUpdated: (userId: string) => `user:me:updated:${userId}`,
    userProfile: (userId: string) => `user:profile:${userId}`
}