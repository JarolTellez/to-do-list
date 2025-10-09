/**
 * Mapper for UserTag entity transformations between layers
 * @class UserTagMapper
 */
class UserTagMapper {
  /**
   * Creates a new UserTagMapper instance
   * @param {Object} dependencies - Dependencies for UserTagMapper
   * @param {class} dependencies.UserTag - UserTag domain class
   * @param {class} dependencies.UserTagResponseDTO - UserTag response DTO class
   * @param {class} dependencies.UserTagRequestDTO - UserTag request DTO class
   * @param {Object} dependencies.tagMapper - Tag mapper instance
   * @param {Object} dependencies.errorFactory - Error factory instance
   */
  constructor({
    UserTag,
    UserTagResponseDTO,
    UserTagRequestDTO,
    tagMapper,
    errorFactory,
  }) {
    this.UserTag = UserTag;
    this.UserTagResponseDTO = UserTagResponseDTO;
    this.UserTagRequestDTO = UserTagRequestDTO;
    this.tagMapper = tagMapper;
    this.errorFactory = errorFactory;
  }

  /**
   * Converts UserTag domain entity to response DTO
   * @param {UserTag} userTagDomain - UserTag domain entity
   * @returns {UserTagResponseDTO} UserTag response DTO
   */
  domainToResponse(userTagDomain) {
    return new this.UserTagResponseDTO({
      id: userTagDomain.id,
      userId: userTagDomain.userId,
      tagId: userTagDomain.tagId,
      createdAt: userTagDomain.createdAt,
      tag: userTagDomain.tag
        ? this.tagMapper.domainToResponse(userTagDomain.tag)
        : null,
    });
  }

  /**
   * Converts request data to UserTag request DTO
   * @param {Object} requestData - Raw request data
   * @returns {UserTagRequestDTO} UserTag request DTO
   */
  requestDataToDTO(requestData) {
    return new this.UserTagRequestDTO({
      userId: requestData.userId,
      tagId: requestData.tagId,
      toDelete: requestData.toDelete || false,
    });
  }

  /**
   * Creates UserTag domain entity from tag and user IDs
   * @param {number} tagId - Tag ID
   * @param {number} userId - User ID
   * @returns {UserTag} UserTag domain entity
   */
  fromTagAndUserToDomain(tagId, userId) {
    const userTag = this.UserTag.create({ userId, tagId });
    return userTag;
  }

  /**
   * Converts database row to UserTag domain entity
   * @param {Object} row - Database row
   * @returns {UserTag|null} UserTag domain entity or null
   */
  dbToDomain(row) {
    if (!row) return null;
    return new this.UserTag({
      id: row.id,
      userId: row.userId,
      tagId: row.tagId,
      createdAt: row.createdAt,
      tag: null,
      user: null,
    });
  }

  /**
   * Converts database row with relations to UserTag domain entity
   * @param {Object} row - Database row with relations
   * @returns {UserTag|null} UserTag domain entity with relations or null
   */
  dbToDomainWithRelations(row) {
    if (!row) return null;

    const tag = row.tag_id ? this.tagMapper.dbToDomain(row) : null;

    return new this.UserTag({
      id: row.user_tag_id,
      userId: row.user_id,
      tagId: row.tag_id,
      createdAt: row.user_tag_created_at,
      tag: tag,
    });
  }
}

module.exports = UserTagMapper;
