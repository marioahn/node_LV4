import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async function(req,res,next) {
  try {
    const { Authorization } = req.cookies;
    // # (403)Cookie가 존재하지 않을 경우
    if (!Authorization) {
      return res.status(403).json({ errorMessage: '로그인이 필요한 기능입니다' })
    }
    
    const [_, token] = Authorization.split(' ');

    const decodedToken = jwt.verify(token, 'hj_secretkey');
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({ where: { userId: +userId } });
    if (!user) {
      res.clearCookie('Authorization');
      throw new Error('해당 토큰 사용자가 존재하지 않습니다');
    };

    req.user = user; // req.user에 조회된 사용자 정보를 할당
    next() // 필수

  } catch (err) {
    res.clearCookie('Authorization');
    switch(err.name) {
      case 'TokenExpiredError':
        return res.status(403).json({ errorMessage: '토큰이 만료되었습니다' });
      case 'JsonWebTokenError':
        return res.status(403).json({ errorMessage: '토큰 인증에 실패하였습니다' });
      default:
        return res.status(401).json({ errorMessage: err.message ?? '비정상적인 요청입니다' });
    }
  };
};