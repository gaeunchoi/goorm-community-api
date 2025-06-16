import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  private async ensurePostExists(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
  }

  private async getCommentOrThrow(commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: { select: { id: true, nickname: true } } },
    });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    return comment;
  }

  async findAllByPost(postId: number) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { id: true, nickname: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      comments: comments.map((c) => ({
        id: c.id,
        author: c.author,
        content: c.content,
        createdAt: c.createdAt,
      })),
      total: comments.length,
    };
  }

  async create({
    content,
    postId,
    authorId,
  }: {
    content: string;
    postId: number;
    authorId: number;
  }) {
    await this.ensurePostExists(postId);
    const comment = await this.prisma.comment.create({
      data: { content, postId, authorId },
      include: { author: { select: { id: true, nickname: true } } },
    });
    return {
      id: comment.id,
      author: comment.author,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  async update(
    commentId: number,
    data: { content?: string },
    userId: number,
    postId: number,
  ) {
    await this.ensurePostExists(postId);
    const comment = await this.getCommentOrThrow(commentId);
    if (comment.author.id !== userId && comment.authorId !== userId) {
      throw new ForbiddenException('권한이 없습니다.');
    }
    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data,
      include: { author: { select: { id: true, nickname: true } } },
    });
    return {
      id: updated.id,
      author: updated.author,
      content: updated.content,
      createdAt: updated.createdAt,
    };
  }

  async remove(commentId: number, userId: number, postId: number) {
    await this.ensurePostExists(postId);
    const comment = await this.getCommentOrThrow(commentId);
    if (comment.author.id !== userId && comment.authorId !== userId) {
      throw new ForbiddenException('권한이 없습니다.');
    }
    const deleted = await this.prisma.comment.delete({
      where: { id: commentId },
    });
    return deleted;
  }
}
