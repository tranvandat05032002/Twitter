import { NextFunction, Request, Response } from "express";
import { ParamsDictionary } from 'express-serve-static-core'
import { COMMON_MESSAGE, STORY_MESSAGES, TWEETS_MESSAGES } from "~/constants/message";
import { StoryParams, StoryQuery, StoryReqBody } from "~/models/request/Story.request";
import { TokenPayload } from "~/models/request/User.requests";
import storyService from "~/services/stories.services";

export const createStoryController = async (req: Request<ParamsDictionary, any, StoryReqBody>, res: Response) => {

    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await storyService.createStory(req.body, user_id)
    res.json({
        message: STORY_MESSAGES.CREATE_STORY_SUCCESS,
        result
    })
}

export const getStoriesByUserController = async (req: Request<StoryParams, any, any, StoryQuery>, res: Response) => {
    const limit = Number(req.query.limit as string)
    const page = Number(req.query.page as string)
    const { user_id } = req.decoded_authorization as TokenPayload
    const { stories, total } = await storyService.getStoriesByUser({ user_id, limit, page })

    res.json({
        message: STORY_MESSAGES.GET_USER_STORY_SUCCESS,
        result: {
            stories,
            limit,
            page,
            total_page: Math.ceil(total / limit)
        }
    })
}
export const deleteStoryController = async (
    req: Request<StoryParams, any, any, StoryQuery>,
    res: Response,
    next: NextFunction) => {
    const { story_id } = req.params
    await storyService.deleteStory(story_id)
    let message = STORY_MESSAGES.DELETE_STORY_SUCCESS
    res.json({
        message,
    })
}

export const viewStoryController = async (
    req: Request<StoryParams, any, any, StoryQuery>,
    res: Response,
    next: NextFunction) => {
    try {
        const { story_id } = req.params
        const { user_id } = req.decoded_authorization as TokenPayload

        if (!story_id || !user_id) {
            return res.status(400).json({
                status: 'error',
                message: 'story_id or user_id is missing'
            })
        }

        await storyService.viewStory({
            story_id,
            user_id
        })

        res.status(200).json({
            status: 'success',
            message: STORY_MESSAGES.GET_STORY_SUCCESS || 'Story marked as viewed'
        })
    } catch (error) {
        console.error('Error in viewStoryController:', error)
        next(error)
    }
}