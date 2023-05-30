import { IdGenerator } from "./../services/idGenerator";
import { TokenManager } from "./../services/TokenManager";
import {
  GetPostsInputDTO,
  GetPostsOutputDTO,
} from "../dtos/posts/getPosts.dto";
import { BadRequestError } from "../errors/BadRequestError";
import { PostsDataBase } from "../database/postsDatabase";
import { Posts } from "../models/posts";
import {
  CreatePostsInputDTO,
  CreatePostsOutputDTO,
} from "../dtos/posts/createPosts.dto";

export class PostsBusiness {
  constructor(
    private tokenManager: TokenManager,
    private postsDatabase: PostsDataBase,
    private idGenerator: IdGenerator
  ) {}
  public getPosts = async (
    input: GetPostsInputDTO
  ): Promise<GetPostsOutputDTO> => {
    const { token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (payload === null) {
      throw new BadRequestError("Token is invalid");
    }

    const postsDB = await this.postsDatabase.findPosts();

    const posts = await Promise.all(
      postsDB.map(async (postDB) => {
        const post = new Posts(
          postDB.id,
          postDB.creator_id,
          postDB.content,
          postDB.likes,
          postDB.deslikes,
          postDB.created_at,
          postDB.updated_at
        );

        const creator = await this.postsDatabase.getCreatorNameById(
          postDB.creator_id
        );

        const businessModel = post.toBusinessModel();

        return {
          ...businessModel,
          creator: {
            creatorId: businessModel.creator.creatorId,
            name: creator ? creator : null,
          },
        };
      })
    );

    const output: GetPostsOutputDTO = posts;

    return output;
  };

  public createPost = async (input: CreatePostsInputDTO) => {
    const { nameCreator, content, token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (payload === null) {
      throw new BadRequestError("Token is invalid");
    }

    const postsDB = await this.postsDatabase.findPostsByContent(content);

    if (postsDB) {
      throw new BadRequestError("Post already exists");
    }

    const id = this.idGenerator.generate();

    const creatorId = await this.postsDatabase.getUserIdByName(nameCreator);

    let likes = 0;
    let deslikes = 0;

    const newPost = new Posts(
      id,
      creatorId,
      content,
      likes,
      deslikes,
      new Date().toISOString(),
      new Date().toISOString()
    );

    const newPostsDB = newPost.toDBModel();
    await this.postsDatabase.insertPost(newPostsDB);

    const output: CreatePostsOutputDTO = {
      content: newPost.getContent(),
    };
    return output;
  };
}