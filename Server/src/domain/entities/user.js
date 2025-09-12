const {ValidationError}=require('../../utils/appErrors');
const errorCodes = require('../../utils/errorCodes');
const UserTag = require('../entities/userTag');

class User{
    #id;
  #userName;
  #email;
  #password;
  #rol;
  #createdAt;
  #userTags;
    constructor({id=null, userName, email, password, rol='usuario', createdAt= new Date(), userTags=[]}) {
        this.#id = id;
        this.#userName = this.#validateUserName(userName);
        this.#email = this.#validateEmail(email);
        this.#password = this.#validatePassword(password);
        this.#rol = this.#validateRol(rol);
        this.#createdAt = createdAt;
        this.#userTags=userTags;

        this.validate();
      }

// business logic
  updateUserName(newUserName) {
    this.#userName = this.#validateUserName(newUserName);
  }

  updateEmail(newEmail) {
    this.#email = this.#validateEmail(newEmail);
  }

  changePassword(newPassword) {
    this.#password = this.#validatePassword(newPassword);
  }

  changeRole(newRole) {
    this.#rol = this.#validateRol(newRole);
  }

  addUserTag(userTag) {
    if (!(userTag instanceof UserTag)) {
       throw new ValidationError('Must provide an instance of UserTag')
    }
    if (!this.#userTags.some(ut => ut.id === userTag.id)) {
      this.#userTags.push(userTag);
    }
  }

  removeUserTag(userTagId) {
    this.#userTags = this.#userTags.filter(ut => ut.id !== userTagId);
  }

  hasTag(tagId) {
    return this.#userTags.some(ut => ut.tagId === tagId);
  }

  // validations
  #validateUserName(userName) {
    if (!userName || userName.trim().length === 0) {
       throw new ValidationError('Username is required',null, errorCodes.REQUIRED_FIELD);
    }
    if (userName.length < 3) {
       throw new ValidationError('Username must be at least 3 characters',{actualUsernameLength:userName.length}, errorCodes.INVALID_FORMAT);
    }
    if (userName.length > 30) {
        throw new ValidationError('Username cannot exceed 30 characters',{actualUsernameLength:userName.length}, errorCodes.INVALID_FORMAT);
    }
    return userName.trim();
  }

  #validateEmail(email) {
    if (!email || email.trim().length === 0) {
         throw new ValidationError('Email is required',null, errorCodes.REQUIRED_FIELD);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
         throw new ValidationError('Invalid email format',null, errorCodes.INVALID_EMAIL);
    }
    return email.trim();
  }

  #validatePassword(password) {
    if (!password || password.trim().length === 0) {
        throw new ValidationError('Password is required',null, errorCodes.REQUIRED_FIELD);
    }
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters',{actualPasswordLength:password.length}, errorCodes.INVALID_FORMAT);
    }
    return password;
  }

  #validateRol(rol) {
    const validRoles = ['usuario', 'admin', 'moderador'];
    if (!validRoles.includes(rol)) {
      throw new ValidationError(`Invalid role: ${rol}. Must be one of: ${validRoles.join(', ')}`);
    }
    return rol;
  }

  validate() {
    const errors = [];
    
    if (!this.#password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }
    
    if (errors.length > 0) {
       throw new ValidationError('Invalid user data', errors);
    }
  }


  get id() { return this.#id; }
  get userName() { return this.#userName; }
  get email() { return this.#email; }
  get rol() { return this.#rol; }
  get createdAt() { return this.#createdAt; }
  get userTags() { return [...this.#userTags]; }


  isAdmin() {
    return this.#rol === 'admin';
  }

  isModerator() {
    return this.#rol === 'moderator';
  }

  getTags() {
    return this.#userTags.map(userTag => userTag.tag).filter(tag => tag !== undefined);
  }

  hasAnyTags() {
    return this.#userTags.length > 0;
  }


  toJSON() {
    return {
      id: this.#id,
      userName: this.#userName,
      email: this.#email,
      rol: this.#rol,
      createdAt: this.#createdAt,
      userTagsCount: this.#userTags.length,
      isAdmin: this.isAdmin(),
       userTags: this.#userTags.map(userTag => userTag.toJSON ? userTag.toJSON() : userTag)
    };
  }

  // statics
  static create({ userName, email, password, rol = 'usuario' }) {
    return new User({
      userName,
      email,
      password,
      rol,
      createdAt: new Date()
    });
  }

  static fromDatabase(data) {
    return new User({
      id: data.id,
      userName: data.user_name,
      email: data.email,
      password: data.password_hash,
      rol: data.rol,
      createdAt: data.created_at,
      userTags: data.user_tags || []
    });
  }


}

module.exports = User;
