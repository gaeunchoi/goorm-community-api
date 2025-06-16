import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const user = await this.prisma.user.create({ data });
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(({ password, ...rest }) => rest);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: number, data: UpdateUserDto) {
    // 닉네임 또는 전화번호가 변경될 경우 중복 체크
    if (data.nickname || data.phoneNumber) {
      const orConditions: { nickname?: string; phoneNumber?: string }[] = [];

      if (data.nickname) orConditions.push({ nickname: data.nickname });
      if (data.phoneNumber)
        orConditions.push({ phoneNumber: data.phoneNumber });

      const conflictUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            orConditions.length > 0 ? { OR: orConditions } : {},
          ],
        },
      });

      if (conflictUser) {
        if (conflictUser.nickname === data.nickname)
          throw new ConflictException('이미 존재하는 별명입니다.');
        if (conflictUser.phoneNumber === data.phoneNumber)
          throw new ConflictException('이미 존재하는 휴대폰번호입니다.');
      }
    }

    const user = await this.prisma.user.update({ where: { id }, data });
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const deletedUser = await this.prisma.user.delete({ where: { id } });
    const { password, ...userWithoutPassword } = deletedUser;
    return userWithoutPassword;
  }
}
