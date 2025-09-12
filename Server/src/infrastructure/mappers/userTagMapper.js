class UserTagMapper{
    constructor(UserTag, tagMapper){
        this.UserTag = UserTag;
        this.tagMapper = tagMapper;
    }
    dbToDomain(row){
        return new this.UserTag({
            id:row.user_tag_id,
            userId:row.user_id,
            tagId: row.tag_id,
            createdAt: row.user_tag_created_at,
            tag: row.tag_id?this.tagMapper.dbToDomain(row):null

        });
    }

}

module.exports = UserTagMapper;