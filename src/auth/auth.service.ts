import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(
    dto: SignUpDto,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { nickname: dto.nickname },
          { phoneNumber: dto.phoneNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email)
        throw new ConflictException('이미 존재하는 이메일입니다.');
      if (existingUser.nickname === dto.nickname)
        throw new ConflictException('이미 존재하는 별명입니다.');
      if (existingUser.phoneNumber === dto.phoneNumber)
        throw new ConflictException('이미 존재하는 휴대폰번호입니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        nickname: dto.nickname,
        phoneNumber: dto.phoneNumber,
      },
    });

    const { password, ...userWithoutPassword } = user;
    const payload = { sub: user.id };
    const accessToken: string = this.jwtService.sign(payload);

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    const user: User | null = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('가입된 이메일이 없습니다.');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');

    const { password, ...userWithoutPassword } = user;
    const token = this.getJwtToken(user.id);
    return {
      user: userWithoutPassword,
      accessToken: token,
    };
  }

  private getJwtToken(userId: number): string {
    return this.jwtService.sign({ sub: userId });
  }

  async validateUserByPayload(payload: { sub: number }): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  }
}
