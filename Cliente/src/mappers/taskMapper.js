import { Task } from '../models/task.js';


const safeMapTags = (tags, mapperFunction) => {
  if (!tags || !Array.isArray(tags)) return [];
  
  return tags.map(tag => {
    try {
      return mapperFunction(tag);
    } catch (error) {
      return {
        id: tag.id || tag.tag?.id || null,
        name: tag.name || tag.tag?.name || 'Tag inválida'
      };
    }
  }).filter(tag => tag && tag.name);
};

export const taskMappers = {

  apiToTask: (apiData) => {

    let tagMappers;
    try {
      tagMappers = require('./tagMapper.js').tagMappers;
    } catch (error) {
      tagMappers = {
        apiToTag: (tag) => ({
          id: tag.id || tag.tag?.id,
          name: tag.name || tag.tag?.name,
          description: tag.description || tag.tag?.description,
          createdAt: tag.createdAt || tag.tag?.createdAt
        })
      };
    }

    const mappedTags = safeMapTags(apiData.taskTags || apiData.tags, tagMappers.apiToTag);
    

    return new Task({
      id: apiData.id,
      name: apiData.name,
      description: apiData.description,
      scheduledDate: apiData.scheduledDate,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCompleted: apiData.isCompleted,
      isOverdue: apiData.isOverdue,
      userId: apiData.userId,
      priority: apiData.priority,
      tags: mappedTags
    });
  },


  taskToCreateDTO: (task) => {
    
    return {
      name: task.name,
      description: task.description,
      scheduledDate: task.scheduledDate,
      priority: task.priority,
      userId: task.userId,
      tags: (task.tags || []).map(tag => ({
        name: tag.name,
        id: tag.id 
      }))
    };
  },


  taskToUpdateDTO: (task) => {
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      scheduledDate: task.scheduledDate,
      priority: task.priority,
      userId: task.userId,
      tags: (task.tags || []).map(tag => ({
        name: tag.name,
        id: tag.id
      }))
    };
  },

  inputToTask: (formData) => {
    
    const procesarFecha = (fecha) => {
      if (!fecha) return null;
      try {
        const d = new Date(fecha);
        return isNaN(d.getTime()) ? null : d;
      } catch (error) {
        return null;
      }
    };

    const mappedTags = formData.tags || [];

    return new Task({
      id: formData.id,
      name: formData.name,
      description: formData.description,
      scheduledDate: procesarFecha(formData.scheduledDate),
      createdAt: procesarFecha(formData.createdAt),
      updatedAt: procesarFecha(formData.updatedAt),
      isCompleted: formData.isCompleted || false,
      isOverdue: formData.isOverdue || false,
      userId: formData.userId,
      priority: formData.priority,
      tags: mappedTags
    });
  }
};