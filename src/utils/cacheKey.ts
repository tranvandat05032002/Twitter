export const redisKey = {
    userMe: (userId: string) => `user:me:${userId}`,
    userProfile: (userId: string) => `user:profile:${userId}`
}