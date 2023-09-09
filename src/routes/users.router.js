import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import joi from 'joi';
import jwt from 'jsonwebtoken';

const router = express.Router();
const createdSchema = joi.object({
  nickname: joi.string().alphanum().min(3).required(),
  password: joi.string().min(4).required(),
  confirm: joi.string().required()
})


/** 1. 회원가입 API(+joi) **/
router.post('/signup', async(req,res) => {
  try {
    // const { nickname, password, confirm } = req.body;
    const validation = await createdSchema.validateAsync(req.body);
    const { nickname, password, confirm } = validation;

    const isExistName = await prisma.users.findFirst({ where: { nickname } });
    if (isExistName) { return res.status(412).json({ errorMessage: '중복된 닉네임입니다' }) };

    if (password.includes(nickname)) { return res.status(412).json({ errorMessage: '패스워드에 닉네임이 포함되어 있습니다' }) };
    if (password !== confirm) { return res.status(412).json({ errorMessage: '패스워드가 일치하지 않습니다' }) };


    await prisma.users.create({ data: { nickname, password, confirm, aboutLike: '' } });

    return res.status(201).json({ message: '회원가입에 성공하였습니다' })
  } catch (err) {
    console.error(err)
    if (err.name === 'ValidationError') {
      return res.status(412).json({ errorMessage: err.message }); // '닉넴,비번 형식이 일치하지 않습니다'
    }
    // *400 예외 케이스에서 처리하지 못한 에러 -> catch문의 마지막에서 처리하는 것이 명세서의 의도인가?
    return res.status(400).json({ errorMessage: '요청한 데이터 형식이 올바르지 않습니다' });
  }
});


/** 2. 로그인 API(+jwt) **/
router.post('/login', async(req,res,next) => {
  try {
    const { nickname, password } = req.body;

    // 생각해보니까, 굳이 user찾을 필요도 없이, if (!nick || !name)하면 되지않나
      // 아, 에러가 '해당하는 유저가 존재치 않을 경우'여서 그럼. 에러메세지가 좀..
    const user = await prisma.users.findFirst({ where: { nickname, password } });
    if (!user) { return res.status(412).json({ errorMessage: '닉네임 또는 패스워드를 확인해주세요' }) };

    // nickname이 아니라, userId를 바탕으로 토큰 생성 - userId가 pk니까 이게 나을듯..? ㅇㅇ그럴듯
    const token = jwt.sign( { userId: user.userId }, 'hj_secretkey' )

    res.cookie('Authorization', `Bearer ${token}`);
    return res.status(200).json({ "token": token });
  } catch (err) { 
    // 400 예외 케이스에서 처리하지 못한 에러
    return res.status(400).json({ errorMessage: '로그인에 실패하였습니다' });
  }
});


export default router;