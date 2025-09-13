class TagMapper {
  constructor(Tag) {
    this.Tag = Tag;
  }
  dbToDomain(row) {
    return new this.Tag({
      id: row.tag_id,
      name: row.tag_name,
      description: row.tag_description,
      createdAt: row.tag_created_at,
      exists: true,
      toDelete: false,
    });
  }

  //   dbJoinToDomain(Id, name, description) {
  //   return new this.Tag({
  //     id: Id,
  //     name: name,
  //     description: description,
  //     exists: true,
  //     toDelete: false,
  //   });
  // }

  // Mapea row recibida de los request del cliente a entidad de dominio del backend
  requestToDomain(tagRequest) {
    return new this.Tag({
      id: tagRequest.id || tagRequest.id || null,
      name: tagRequest.name,
      description: tagRequest.description || null,
      exists: tagRequest.exists,
      toDelete: tagRequest.toDelete,
    });
  }
}

module.exports = TagMapper;
