import { Tag } from '../models/tag';

export const tagMappers = {

  apiToTag: (apiData) => {
     if (!apiData) return null;
    
    if (apiData.tag) {
      return new Tag({
        id: apiData.tag.id,
        name: apiData.tag.name,
        description: apiData.tag.description,
        createdAt: apiData.tag.createdAt
      });
    }
 
      return new Tag({
        id: apiData.id,
        name: apiData.name,
        description: apiData.description,
        createdAt: apiData.createdAt
      });
    
  },


  inputToTag: (tagInput) => {
    return new Tag({
      id: tagInput.id || null,
      name: tagInput.name,
      description: tagInput.description,
      createdAt: tagInput.createdAt ? new Date(tagInput.createdAt) : new Date()
    });
  },

  tagToCreateDTO: (tag) => {
    return {
      name: tag.name,
      description: tag.description
    };
  },

 
  tagToUpdateDTO: (tag) => {
    return {
      id: tag.id,
      name: tag.name,
      description: tag.description
    };
  }
};