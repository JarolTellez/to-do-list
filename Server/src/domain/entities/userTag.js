const {ValidationError}=require('../../utils/appErrors');
const errorCodes = require('../../utils/errorCodes');
const Tag = require('../entities/tag');
const User = require('../entities/user');

class UserTag {
  #id;
  #userId;
  #tagId;
  #createdAt;
  #tag; 
  #user; 

  constructor({
    id = null,
    userId,
    tagId,
    createdAt = new Date(),
    tag = null,
    user = null
  }) {
    this.#id = id;
    this.#userId = userId;
    this.#tagId = tagId;
    this.#createdAt = createdAt;
    this.#tag = tag;
    this.#user = user;
    
    this.validate(); 
  }

  // business logic
  assignTag(tag) {
    if (!(tag instanceof Tag)) {
      throw new ValidationError('Must provide a valid Tag instance');
    }
    this.#tag = tag;
    this.#tagId = tag.id;
  }

  assignUser(user) {
    if (!(user instanceof User)) {
       throw new ValidationError('Must provide a valid User instance');
    }
    this.#user = user;
    this.#userId = user.id;
  }

   assignCreatedAt(date) {
    
    this.#createdAt = date;
  }

   assignId(id) {
    
    this.#id = id;
  }
  // validations
  validate() {
    const errors = [];
    
    if (!this.#userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    
    if (!this.#tagId) {
      errors.push({ field: 'tagId', message: 'Tag ID is required' });
    }
    
    if (errors.length > 0) {
       throw new ValidationError('Invalid UserTag data', errors);
    }
  }


  get id() { return this.#id; }
  get userId() { return this.#userId; }
  get tagId() { return this.#tagId; }
  get createdAt() { return this.#createdAt; }
  get tag() { return this.#tag; }
  get user() { return this.#user; }

  isRecent(hours = 24) {
  const created = this.#createdAt instanceof Date ? 
                 this.#createdAt : new Date(this.#createdAt);
  const hoursDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= hours;
}

  hasTag() {
    return this.#tag !== null && this.#tag !== undefined;
  }

  hasUser() {
    return this.#user !== null && this.#user !== undefined;
  }

  isValid() {
    return this.hasTag() && this.hasUser();
  }


  toJSON() {
    return {
      id: this.#id,
      userId: this.#userId,
      tagId: this.#tagId,
      createdAt: this.#createdAt,
      tag: this.#tag ? (this.#tag.toJSON ? this.#tag.toJSON() : this.#tag) : null,
      user: this.#user ? { 
        id: this.#user.id, 
        userName: this.#user.userName 
      } : null,
      isRecent: this.isRecent(),
      isValid: this.isValid()
    };
  }

  // statics
  static create({ userId, tagId, user = null, tag = null }) {
    return new UserTag({
      userId,
      tagId,
      user,
      tag,
      createdAt: new Date()
    });
  }

  static fromDatabase(data) {
    return new UserTag({
      id: data.id,
      userId: data.user_id,
      tagId: data.tag_id,
      createdAt: data.created_at,
      tag: data.tag || null,
      user: data.user || null
    });
  }

  static assign({ user, tag }) {
    if (!user || !tag) {
       throw new ValidationError('User and Tag are required for assignment',{user, tag}.errorCodes.REQUIRED_FIELD);
       
    }
    
    if (!user.id || !tag.id) {
      throw new Error('User and Tag must have IDs for assignment');
       throw new ValidationError('User and Tag must have IDs for assignment',{userId:user.id,tagId:tag.id}.errorCodes.REQUIRED_FIELD);
      
    }
    
    return new UserTag({
      userId: user.id,
      tagId: tag.id,
      user,
      tag,
      createdAt: new Date()
    });
  }

  static createBulkAssignments(user, tags = []) {
    if (!user || !user.id) {
       throw new ValidationError('Valid user is required for bulk assignment',{user:user,userId:user.id}.errorCodes.REQUIRED_FIELD);
      
    }
    
    return tags.map(tag => 
      UserTag.assign({ user, tag })
    );
  }
}

module.exports = UserTag;