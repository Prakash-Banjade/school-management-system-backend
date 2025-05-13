import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtModule as Jwt } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from 'src/students/entities/student.entity';
import { Teacher } from 'src/teachers/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Teacher
    ]),
    Jwt.register({
      global: true,
      secret: process.env.ACCESS_TOKEN_SECRET!,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_SEC! },
    }),
  ],
  providers: [
    JwtService,
  ],
  exports: [JwtService],
})
export class JwtModule { }
