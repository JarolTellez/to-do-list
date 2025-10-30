import { Task } from "../models/task.js";
import { tagMappers } from "./tagMapper.js";


export const taskMappers = {
  apiToTask: (apiData) => {
    const mappedTags = (apiData.tags || apiData.taskTags|| [])
      .map(tag => tagMappers.apiToTag(tag));

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
      tags: mappedTags,
    });
  },

  taskToCreateDTO: (task) => {
    const tagDTOs = (task.tags || []).map((tag) =>
      tagMappers.tagToCreateDTO(tag)
    );
    return {
      name: task.name,
      description: task.description,
      scheduledDate: task.scheduledDate,
      priority: task.priority,
      userId: task.userId,
      tags: tagDTOs
    };
  },

  taskToUpdateDTO: (task) => {
    const tagDTOs = (task.tags || []).map(tag => tagMappers.tagToUpdateDTO(tag));

    return {
      id: task.id,
      name: task.name,
      description: task.description,
      scheduledDate: task.scheduledDate,
      priority: task.priority,
      userId: task.userId,
      tags: tagDTOs,
    };
  },

  inputToTask: (formData) => {
    const mappedTags =(formData.tags || formData.taskTags || [])
      .map(tag => tagMappers.apiToTag(tag))

    const procesarFecha = (fecha) => {
      if (!fecha) return null;
      try {
        const d = new Date(fecha);
        return isNaN(d.getTime()) ? null : d;
      } catch (error) {
        return null;
      }
    };


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
      tags: mappedTags,
    });
  },
};
