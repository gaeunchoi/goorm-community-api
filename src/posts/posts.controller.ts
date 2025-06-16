import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: User) {
    return this.postsService.create(dto, user.id);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const post = await this.postsService.findOne(+id);
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    return post;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: User,
  ) {
    const post = await this.postsService.findOne(+id);
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (post.authorId !== user.id)
      throw new ForbiddenException('본인만 수정할 수 있습니다.');
    return this.postsService.update(+id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    const post = await this.postsService.findOne(+id);
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.authorId !== user.id) {
      throw new ForbiddenException('본인만 삭제할 수 있습니다.');
    }

    return await this.postsService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @CurrentUser() user: User) {
    const postId = +id;
    const post = await this.postsService.findOne(postId);
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    return this.postsService.toggleLike(postId, user.id);
  }
}
