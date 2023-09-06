import express from 'express';
import { prisma } from '../utils/prisma/index.js'
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/** 1. 댓글 생성 API **/
router.post('/:postId/comments', authMiddleware, async(req,res) => {
  try {
    const { userId, nickname } = req.user;
    const { postId }  = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(412).json({ errorMessage: '댓글(body데이터)을 입력해주세요' })
    };

    const post = await prisma.posts.findFirst({ where: { postId: +postId } });
    if (!post) {
      return res.status(404).json({ errorMessage: '게시글이 존재하지 않습니다' })
    };

    await prisma.comments.create({ 
      data: { PostId: +postId, UserId: userId, Nickname: nickname, comment }
    });

    return res.status(201).json({ message: '댓글을 작성하였습니다' });
  } catch (err) {
    return res.status(400).json({ errorMessage: '댓글 작성에 실패하였습니다' });
  }
});


/** 2. '해당 게시글의' 댓글 (전체)조회 **/
router.get('/:postId/comments', async(req,res) => {
  try {
    const { postId } = req.params;
    
    const post = await prisma.posts.findUnique({ where: { postId: +postId } });

    const comments = await prisma.comments.findMany({
      where: { PostId: +postId }, 
      select: {
        commentId: true,
        UserId: true,
        PostId: true,
        Nickname: true,
        comment: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 1)게시글 자체가 존재안하면?
    if (post === null) { // console.log(post)로 check
      return res.status(400).json({ errorMessage: '해당 게시글이 존재하지 않습니다' })
    };

    // 2)게시글은 존재하는데, 댓글작성한게 없으면?
    if (comments.length === 0) { 
      return res.status(400).json({ errorMessage: '아직 작성한 댓글이 없습니다' })
    };

    return res.status(200).json({ comments: comments });
  } catch (err) {
    return res.status(400).json({ errorMessage: '댓글 조회에 실패하였습니다' });
  }
});


/** 3. 댓글 수정 **/
router.put('/:postId/comments/:commentId', authMiddleware, async(req,res) => {
  try {
    const { userId } = req.user;
    const { postId, commentId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(412).json({ errorMessage: '댓글 내용을 입력해주세요' });
    };

    const post = await prisma.posts.findUnique({ where: { postId: +postId } });
    if (post === null) {
      return res.status(404).json({ errorMessage: '수정할 게시글이 존재하지 않습니다'})
    };

    // 수정할 댓글 찾기
    const oneComment = await prisma.comments.findUnique({ where: { commentId: +commentId } });
    if (oneComment["UserId"] !== userId) {
      return res.status(403).json({ errorMessage: '댓글의 수정권한이 존재하지 않습니다' })
    };

    // # 404 댓글이 존재하지 않는경우
    if (oneComment === null) { // console.log(oneComment)
      return res.status(404).json({ errorMessage: '댓글이 존재하지 않습니다' })
    };

    const isCommentUpdated = await prisma.comments.update({
      data: { comment },
      where: { PostId: +postId, commentId: +commentId }
    });

    if (!isCommentUpdated) {
      return res.status(401).json({ errorMessage: '댓글 수정이 정상적으로 처리되지 않았습니다' })
    };

    return res.status(200).json({ message: '댓글을 수정하였습니다' });
  } catch (err) {
    return res.status(400).json({ errorMessage: '댓글 수정에 실패하였습니다' });
  }
});


/** 4. 댓글 삭제 **/
router.delete('/:postId/comments/:commentId', authMiddleware, async(req,res) => {
  try {
    const { userId } = req.user;
    const { postId, commentId } = req.params;

    // # 404 댓글을 삭제할 게시글이 존재하지 않는 경우
    const post = await prisma.posts.findUnique({ where: { postId: +postId } });
    if (post === null) {
      return res.status(404).json({ errorMessage: '게시글이 존재하지 않습니다'})
    };

    // # 404 댓글이 존재하지 않는 경우
    const comment = await prisma.comments.findUnique({ where: { commentId: +commentId } });
    if (comment === null) { 
      return res.status(404).json({ errorMessage: '댓글이 존재하지 않습니다' })
    };

    // # 403 댓글 삭제 권한이 없는 경우
    if (comment["UserId"] !== userId) {
      return res.status(403).json({ errorMessage: '댓글의 삭제권한이 존재하지 않습니다' })
    };


    const isCommentDeleted = await prisma.comments.delete({
      where: { PostId: +postId, commentId: +commentId }
    })

    if (!isCommentDeleted) {
      return res.status(401).json({ errorMessage: '댓글 삭제가 정상적으로 처리되지 않았습니다' })
    };

    return res.status(200).json({ message: '댓글을 삭제하였습니다' });
  } catch (err) {
    return res.status(400).json({ errorMessage: '댓글 삭제에 실패하였습니다' });
  }
});


export default router;