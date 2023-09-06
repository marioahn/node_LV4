import express from 'express';
import PostsRouter from './posts.router.js';
import CommentsRouter from './comments.router.js';
import LikesRouter from './likes.router.js';
// user는 경로가 아예 다르므로 따로.

const router = express.Router();

router.use('/posts', [PostsRouter,CommentsRouter, LikesRouter]);

export default router;