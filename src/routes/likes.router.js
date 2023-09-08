import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();


/** 1. 게시글에 좋아요 추가&취소 API */
router.put('/:postId/like', authMiddleware, async(req,res) => {
  try {
    const { postId } = req.params;
    const { userId, aboutLike } = req.user; // 현 사용자의 '게시글 좋아요의 정보'를 호출

    const post = await prisma.posts.findUnique({ where: { postId: +postId } });
    console.log(postId)
    
    if (!post) return res.status(404).json({ errorMessage: '게시글이 존재하지 않습니다' });
    // 아래 메세지가 404에러코드보다 아래 있어야 한다 - x게시글의 params들어오면 post=null이라 아래 에러뜸
    const [plusLikes, minusLikes] = [post.likes+1, post.likes-1]
    
    // step1. 좋아요를 누르지 않은 상태라면? -> 추가하기
    if (!aboutLike.includes(`${postId} `)) {
      const aboutLike2 = aboutLike + postId + ' ' // 공백으로 간 게시글id구분 -> '1 2 3 23 '

      await prisma.users.update({ data: { aboutLike: aboutLike2 }, where: { userId: userId }});
      await prisma.posts.update({ data: { likes: plusLikes }, where: { postId: +postId } });
      

      return res.status(200).json({ message: '게시글의 좋아요를 등록하였습니다' });
    }
    // step2. 좋아요를 누른 상태라면? -> 취소하기
    else {
      console.log(aboutLike)
      const aboutLike2 = aboutLike.replaceAll(`${postId} `,'') // postId+' '으로 찾기
      console.log(aboutLike2)

      await prisma.users.update({ data: { aboutLike: aboutLike2 }, where: { userId: userId }});
      await prisma.posts.update({ data: {likes: minusLikes}, where: { postId: +postId } });

      return res.status(200).json({ message: '게시글의 좋아요를 취소하였습니다' });
    };
  } catch (err) {
    console.log(err.name)
    return res.status(400).json({ errorMessage: '게시글 좋아요 추가/취소에 실패하였습니다' });
  }
});


/** 2. 좋아요 게시글 조회 API */
  // 경로 그냥, 'like'만 하면, posts.router.js의 상세게시글 조회 api로 넘어감;;
router.get('/like', authMiddleware, async(req,res) => {
  try {
    const { aboutLike } = req.user;

    // step1: 반복문 돌려서, 조건에 맞는것 + 필요한 필드만 골라서 arr에 추가
    const favoritePosts = []
    console.log(aboutLike)
    let arr = aboutLike.split(' ')
    console.log(arr)
    for (let i=0; i<arr.length-1; i++) { // ['20','21',''] -> arr.length-1
      const post = await prisma.posts.findUnique({
        where: { postId: +arr[i] },
        select: {
          postId: true,
          UserId: true,
          Nickname: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          likes: true
        }
      });

      favoritePosts.push(post);
    };

    // step2: 정렬
    favoritePosts.sort((a,b) => b.likes-a.likes)

    return res.status(200).json({ posts: favoritePosts })
  } catch (err) {
    // console.log(err.name)
    return res.status(400).json({ errorMessage: '좋아요 게시글 조회에 실패하였습니다' });
  }
});


export default router;