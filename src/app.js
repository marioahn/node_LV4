import express from 'express';
import cookieParser from 'cookie-parser';
import dotEnv from 'dotenv';
import UsersRouter from './routes/users.router.js';
import IndexRouter from './routes/index.js';

dotEnv.config();

const app = express();
const PORT = process.env.DATABASE_PORT;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [UsersRouter, IndexRouter]);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});