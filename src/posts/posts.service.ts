import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreatePostDto, authorId: number) {
    return this.prisma.post.create({
      data: {
        ...data,
        authorId,
      },
    });
  }

  findAll() {
    return this.prisma.post.findMany({
      include: { author: true, comments: true },
    });
  }

  findOne(id: number) {
    return this.prisma.post.findUnique({ where: { id } });
  }

  update(id: number, data: UpdatePostDto) {
    return this.prisma.post.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }

  async toggleLike(postId: number, userId: number) {
    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({
        where: { postId_userId: { postId, userId } },
      });
    } else {
      await this.prisma.postLike.create({
        data: { postId, userId },
      });
    }
    const likes = await this.prisma.postLike.count({ where: { postId } });
    await this.prisma.post.update({
      where: { id: postId },
      data: { likes },
    });
    return { liked: !existing, likes };
  }
}
