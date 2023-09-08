import express from 'express';
import PostsRouter from './posts.router.js';
import CommentsRouter from './comments.router.js';
import LikesRouter from './likes.router.js';
// user는 시작 경로가 아예 다르므로 따로.

const router = express.Router();


router.use('/posts', [LikesRouter]);
router.use('/posts', [PostsRouter,CommentsRouter]);
// router.use('/posts', [PostsRouter,CommentsRouter,LikesRouter]);
// 위처럼, 3개를 한꺼번에 쓰면 like가 postID라는 파람스로 인식 -> 따로따로 쓰기

export default router;