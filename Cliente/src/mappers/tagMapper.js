import { Tag } from "../models/tagModel.js";

export function mapApiToTagModel(apiDatos) {
  return new Tag(
    apiDatos.id,
    apiDatos.name,
    apiDatos.description || null,
    true,
    false,
    apiDatos.userId,
    apiDatos.taskTagId
  );
}
