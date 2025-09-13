class TaskTagMapper{

    constructor(TaskTag, tagMapper){
        this.TaskTag = TaskTag;
        this.tagMapper=tagMapper;
    }
    
  // dbToDomain(row){
  //   return new this.TaskTag({
  //       id: row.task_tag_id,
  //       taskId: row.task_id,
  //       tagId: row.tag_id,
  //       createdAt:row.task_tag_created_at,
  //       tag: row.tag_id?this.tagMapper.dbToDomain(row):null,
  //   });
        
    
  // }

  dbToDomain(row) {
  return new this.TaskTag({
    id: row.task_tag_id,
    taskId: row.task_id,
    tagId: row.tag_id,
    createdAt: row.task_tag_created_at,
    tag: row.tag_id ? this.tagMapper.dbToDomain(row) : null,
  });
}

}
module.exports = TaskTagMapper;