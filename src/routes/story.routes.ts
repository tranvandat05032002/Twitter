import { deleteStoryController, getStoriesByUserController, viewStoryController } from './../controllers/stories.controller';
import { Router } from "express"
import { createStoryController } from "~/controllers/stories.controller"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import wrapRequestHandler from "~/utils/handlers"

const storiesRouter = Router()
/**
 * Description: create story
 * Path: /create
 * Method: POST
 * Body: {media: {type: number, url: string}}
 * Header: { Authorization: Bearer <access_token> }
 */
storiesRouter.post(
    '/create',
    accessTokenValidator,
    verifiedUserValidator,
    wrapRequestHandler(createStoryController)
)

/**
 * Description: list stories by user
 * Path: /
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
storiesRouter.get('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getStoriesByUserController))

/**
* Description: list stories by user
 * Path: /
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
storiesRouter.delete('/:story_id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(deleteStoryController))

/**
 * Description: view story
 * Path: /
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
storiesRouter.patch('/:story_id/view', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(viewStoryController))

export default storiesRouter