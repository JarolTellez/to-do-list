/**
 * Mapper for Tag entity transformations between layers
 * @class TagMapper
 */
class TagMapper {
  /**
   * Creates a new TagMapper instance
   * @param {Object} dependencies - Dependencies for TagMapper
   * @param {class} dependencies.Tag - Tag domain class
   * @param {class} dependencies.TagResponseDTO - Tag response DTO class
   * @param {class} dependencies.TagRequestDTO - Tag request DTO class
   * @param {Object} dependencies.errorFactory - Error factory instance
   */
  constructor({ Tag, TagResponseDTO, TagRequestDTO, errorFactory }) {
    this.Tag = Tag;
    this.TagResponseDTO = TagResponseDTO;
    this.TagRequestDTO = TagRequestDTO;
    this.errorFactory = errorFactory;
  }

  /**
   * Converts Tag domain entity to response DTO
   * @param {Tag} tagDomain - Tag domain entity
   * @returns {TagResponseDTO} Tag response DTO
   */
  domainToResponse(tagDomain) {
    return new this.TagResponseDTO({
      id: tagDomain.id,
      name: tagDomain.name,
      description: tagDomain.description,
      createdAt: tagDomain.createdAt,
    });
  }

  /**
   * Converts request data to create tag request DTO
   * @param {Object} requestData - Raw request data
   * @returns {TagRequestDTO} Tag request DTO
   */
  requestDataToCreateRequestDTO(requestData) {
    return new this.TagRequestDTO({
      id: requestData.id ? requestData.id : null,
      name: requestData.name,
      description: requestData.description,
    });
  }

  /**
   * Converts create tag request DTO to Tag domain entity
   * @param {TagRequestDTO} createTagRequest - Create tag request DTO
   * @returns {Tag} Tag domain entity
   */
  createRequestToDomain(createTagRequest) {
    return this.Tag.create({
      id: createTagRequest.id,
      name: createTagRequest.name,
      description: createTagRequest.description
        ? createTagRequest.description
        : null,
    });
  }

  /**
   * Converts update tag request to Tag domain entity
   * @param {Object} updateTagRequest - Update tag request
   * @param {Tag} existingTag - Existing tag domain entity
   * @returns {Tag} Updated Tag domain entity
   */
  requestToDomain(updateTagRequest, existingTag) {
    return new this.Tag({
      id: existingTag.id,
      name: updateTagRequest.name ?? existingTag.name,
      description: updateTagRequest.description ?? existingTag.description,
      exists: existingTag.exists,
      createdAt: existingTag.createdAt,
      taskTags: existingTag.taskTags,
      userTags: existingTag.userTags,
    });
  }

  /**
   * Converts database row to Tag domain entity
   * @param {Object} row - Database row
   * @returns {Tag|null} Tag domain entity or null
   */
  dbToDomain(row) {
    if (!row) return null;

    return new this.Tag({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.createdAt,
      exists: true,
      taskTags: [],
      userTags: [],
    });
  }
}

module.exports = TagMapper;
