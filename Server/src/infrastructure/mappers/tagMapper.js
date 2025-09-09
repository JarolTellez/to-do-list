class TagMapper{
  constructor(Tag){
    this.Tag=Tag;
  }
   dbToDomain(tag) {
  const { id, name, description, user_id } = tag;

  return new this.Tag({
    id: id,
    name: name,
    descripcion: description,
    exists: true,
    toDelete: false,
    userId: user_id,
    taskTagId: null
  });
}


  dbJoinToDomain(Id, name, description, tagUserId, taskTagId) {
//  console.log('TIENE ID USUARIO: ', tagUserId);
  return new this.Tag({
    id: Id,
    name: name,
    description: description,
    exists: true,
    toDelete: false,
    userId: tagUserId,
    taskTagId: taskTagId
  });
}

// Mapea tag recibida de los request del cliente a entidad de dominio del backend
   requestToDomain(tagRequest, userId=null) {
    return new this.Tag({
      id: tagRequest.id || tagRequest.id|| null ,
      name: tagRequest.name, 
      description: tagRequest.description || null,
      exists: tagRequest.exists,    
      toDelete: tagRequest.toDelete,   
      userId: tagRequest.userId || userId,
      taskTagId: tagRequest.taskTagId || null
   });
  
  }

 
}

module.exports = TagMapper;