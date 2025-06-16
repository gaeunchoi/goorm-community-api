import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Request } from 'express';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentService: CommentsService) {}

  // 댓글 조회
  @Get()
  async findAllByPost(@Param('postId') postId: string) {
    return this.commentService.findAllByPost(+postId);
  }

  // 댓글 작성
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number };
    return this.commentService.create({
      content: dto.content,
      postId: +postId,
      authorId: user.id,
    });
  }

  // 댓글 수정
  @UseGuards(JwtAuthGuard)
  @Patch(':commentId')
  async update(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number };
    return await this.commentService.update(+commentId, dto, user.id, +postId);
  }

  // 댓글 삭제
  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async remove(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: number };
    return await this.commentService.remove(+commentId, user.id, +postId);
  }
}
