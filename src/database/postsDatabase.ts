import { BadRequestError } from "../errors/BadRequestError";
import { postsDB } from "../models/posts";
import { BaseDatabase } from "./BaseDatabase";

export class PostsDataBase extends BaseDatabase {
  public static POST_TABLE = "posts";
  public static USER_TABLE = "users";

  public findPosts = async () => {
    const result: postsDB[] = await BaseDatabase.connection(
      PostsDataBase.POST_TABLE
    );

    return result;
  };

  public findPostsByContent = async (
    content: string
  ): Promise<postsDB | undefined> => {
    const [postDB]: postsDB[] | undefined = await BaseDatabase.connection(
      PostsDataBase.POST_TABLE
    ).where({ content });

    return postDB;
  };

  public getUserIdByName = async (nameCreator: string): Promise<string> => {
    const user = await BaseDatabase.connection(PostsDataBase.USER_TABLE)
      .select("id")
      .where("name", nameCreator)
      .first();

    if (user) {
      return user.id;
    } else {
      throw new BadRequestError("User not found");
    }
  };

  public insertPost = async (newPostsDB: postsDB): Promise<void> => {
    await BaseDatabase.connection(PostsDataBase.POST_TABLE).insert(newPostsDB);
  };

  public getCreatorNameById = async (idCreator: string): Promise<string> => {
    const nameUser = await BaseDatabase.connection(PostsDataBase.USER_TABLE)
      .select("name")
      .where("id", idCreator)
      .first();

    if (nameUser) {
      return nameUser.name;
    } else {
      throw new BadRequestError("User not found");
    }
  };
}
