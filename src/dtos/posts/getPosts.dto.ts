import z from "zod";
import { postsModel } from "../../models/posts";

export interface GetPostsInputDTO {
  token: string;
}

export type GetPostsOutputDTO = postsModel[];

export const GetProductsSchema = z
  .object({
    token: z.string().min(1),
  })
  .transform((data) => data as GetPostsInputDTO);
