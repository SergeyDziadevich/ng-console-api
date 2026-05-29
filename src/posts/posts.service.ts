import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from '../schemas/post.schema';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<Post>,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async createPost({ userId, ...createPostDto }): Promise<Post> {
    const findUser = await this.userModel.findById(userId);
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const newPost = new this.postModel(createPostDto);
    const savedPost = await newPost.save();
    await findUser.updateOne({
      $push: { posts: savedPost._id },
    });

    return savedPost;
  }

  findPostById(id: string) {
    return this.postModel.findById(id).exec();
  }
}
