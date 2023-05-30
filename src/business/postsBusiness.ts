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
import {
  EditPostsInputDTO,
  EditPostsOutputDTO,
} from "../dtos/posts/editPosts.dto";
import { postsDB } from "../models/posts";
import {
  DeletePostsInputDTO,
  DeletePostsOutputDTO,
} from "../dtos/posts/deletePost.dto";

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

  public createPost = async (
    input: CreatePostsInputDTO
  ): Promise<CreatePostsOutputDTO> => {
    const { content, token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (payload === null) {
      throw new BadRequestError("Token is invalid");
    }

    const postsDB = await this.postsDatabase.findPostsByContent(content);

    if (postsDB) {
      throw new BadRequestError("Post already exists");
    }

    const nameCreator = payload.name;
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

  public editPost = async (input: EditPostsInputDTO) => {
    const { id, content, token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token is invalid");
    }

    const postToEditDB = await this.postsDatabase.findPostById(id);

    if (!postToEditDB) {
      throw new BadRequestError("Posts não existe");
    }

    if (payload.id !== postToEditDB.creator_id) {
      throw new BadRequestError("Esse usuario não possui esse post");
    }

    const post = new Posts(
      postToEditDB.id,
      postToEditDB.creator_id,
      postToEditDB.content,
      postToEditDB.likes,
      postToEditDB.deslikes,
      postToEditDB.created_at,
      postToEditDB.updated_at
    );

    content && post.setContent(content);
    post.setUpdatedAt(new Date().toISOString());

    const updatedPostDB: postsDB = {
      id: post.getId(),
      creator_id: post.getCreatorId(),
      content: post.getContent(),
      likes: post.getLikes(),
      deslikes: post.getDeslikes(),
      created_at: post.getCreatedAt(),
      updated_at: post.getUpdatedAt(),
    };

    await this.postsDatabase.updatePost(id, updatedPostDB);

    const output: EditPostsOutputDTO = {
      content,
    };

    return output;
  };

  public deletePost = async (input: DeletePostsInputDTO) => {
    const { id, token } = input;

    const payload = this.tokenManager.getPayload(token);

    if (!payload) {
      throw new BadRequestError("Token is invalid");
    }

    const postToDelete = await this.postsDatabase.getPostToDelete(id);

    if (!postToDelete) {
      throw new BadRequestError("Post not exists.");
    }

    if (payload.role === "NORMAL" && payload.id !== postToDelete.creator_id) {
      throw new BadRequestError(
        "usuário não tem permissão para apagar esse post."
      );
    }

    await this.postsDatabase.deletePostsData(id);

    const output: DeletePostsOutputDTO = {
      message: "Post deleted",
    };
    return output;
  };
}
