import z from "zod";

export interface CreatePostsInputDTO {
  nameCreator: string;
  content: string;
  token: string;
}

export interface CreatePostsOutputDTO {
  content: string;
}

export const CreateProductSchema = z
  .object({
    nameCreator: z
      .string({ invalid_type_error: "nameCreator deve ser string" })
      .nonempty()
      .min(1),
    content: z
      .string({ invalid_type_error: "content deve ser string" })
      .nonempty()
      .min(2),
    token: z.string().nonempty().min(1),
  })
  .transform((data) => data as CreatePostsInputDTO);
