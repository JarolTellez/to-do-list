import { User } from '../models/user';

export const userMappers = {

  apiToUser: (apiData) => {
    return new User(
      apiData.id,
      apiData.username,
      apiData.email,
      apiData.rol || 'user',
      apiData.createdAt,
      apiData.updatedAt,
      apiData.userTagsCount || 0,
      apiData.tasksCount || 0,
      apiData.userTags || [],
      apiData.tasks || []
    );
  },

 
  userToUpdateDTO: (user) => {
    return {
      username: user.username,
      email: user.email
    };
  },


  inputToRegisterDTO: (userInput) => {
    return {
      username: userInput.username,
      email: userInput.email,
      password: userInput.password
    };
  },

  inputToLoginDTO:(userInput)=>{
    return{
      identifier: userInput.identifier,
      password: userInput.password
    }

  }
};