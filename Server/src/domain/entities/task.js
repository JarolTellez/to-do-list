const {ValidationError}=require('../../utils/appErrors');
const errorCodes = require('../../utils/errorCodes');
const TaskTag = require('../entities/taskTag');
class Task{
  #id;
  #name;
  #description;
  #scheduledDate;
  #createdAt;
  #lastUpdateDate;
  #isCompleted;
  #userId;
  #priority;
  #taskTags;

    constructor({id=null,name,description='',scheduledDate=null, createdAt= new Date(),lastUpdateDate= new Date(),isCompleted=false,userId,priority=null, taskTags=[]}){
        this.#id=id;
        this.#name= this.#validateName(name);
        this.#description=description;
        this.#scheduledDate= scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
        this.#createdAt= createdAt instanceof Date ? createdAt : new Date(createdAt);
        this.#lastUpdateDate= lastUpdateDate instanceof Date ? lastUpdateDate : new Date(lastUpdateDate);
        this.#isCompleted=isCompleted;
        this.#userId=userId;
        this.#priority=priority;
        this.#taskTags = taskTags;
    }

    complete(){
      this.#isCompleted = true;
      this.#lastUpdateDate = new Date();
    }

    uncomplete(){
      this.#isCompleted = false;
      this.#lastUpdateDate = new Date();
    }

    updatePriority(newPriority){
      this.#priority = newPriority;
      this.#lastUpdateDate = new Date();
    }

    updateName(newName){
      this.#name= this.#validateName(newName);
      this.#lastUpdateDate = new Date();
    }

    updateDescription(newDescription){
      this.#description = newDescription;
      this.#lastUpdateDate = new Date();
    }

     addTaskTag(taskTag) {
    if (!(taskTag instanceof TaskTag)) {
     
      throw new ValidationError('Must provide an instance of TaskTag')
    }
    if (!this.#taskTags.some(tt => tt.id === taskTag.id)) {
      this.#taskTags.push(taskTag);
      this.#lastUpdateDate = new Date();
    }
  }

    removeTaskTag(taskTagId) {
    this.#taskTags = this.#taskTags.filter(tt => tt.id !== taskTagId);
    this.#lastUpdateDate = new Date();
  }

  hasTag(tagId) {
    return this.#taskTags.some(tt => tt.tagId === tagId);
  }

 // Validations
  #validateName(name) {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Task name is required', null, errorCodes.REQUIRED_FIELD);
    }
    if (name.length > 30) {
      throw new ValidationError('Task name cannot exceed 30 characters',{ActualTaskNameLength:name.length},errorCodes.INVALID_FORMAT);
    }
    return name.trim();
  }

  validate() {
    const errors = [];
    
    if (!this.#userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    
    if (this.#scheduledDate && new Date(this.#scheduledDate) < new Date()) {
      errors.push({ field: 'scheduledDate', message: 'Scheduled date cannot be in the past' });
    }
    
    if (errors.length > 0) {
      throw new ValidationError("Invalid task data", errors);
    }
  }


  get id() { return this.#id; }
  get name() { return this.#name; }
  get description() { return this.#description; }
  get scheduledDate() { return this.#scheduledDate; }
  get createdAt() { return this.#createdAt; }
  get lastUpdateDate() { return this.#lastUpdateDate; }
  get isCompleted() { return this.#isCompleted; }
  get userId() { return this.#userId; }
  get priority() { return this.#priority; }
  get taskTags() { return [...this.#taskTags]; }


  isOverdue() {
    return this.#scheduledDate && 
           new Date() > new Date(this.#scheduledDate) && 
           !this.#isCompleted;
  }

  isScheduledForToday() {
    if (!this.#scheduledDate) return false;
    
    const today = new Date();
    const scheduled = new Date(this.#scheduledDate);
    
    return scheduled.toDateString() === today.toDateString();
  }

  getTags() {
    return this.#taskTags.map(taskTag => taskTag.tag).filter(tag => tag !== undefined);
  }


  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      scheduledDate: this.#scheduledDate,
      createdAt: this.#createdAt,
      lastUpdateDate: this.#lastUpdateDate,
      isCompleted: this.#isCompleted,
      userId: this.#userId,
      priority: this.#priority,
      taskTags: this.#taskTags.map(taskTag => taskTag.toJSON ? taskTag.toJSON() : taskTag),
      isOverdue: this.isOverdue(),
      isScheduledForToday: this.isScheduledForToday()
    };
  }


  static create({ name, description = '', userId, scheduledDate = null, priority = null }) {
    return new Task({
      name,
      description,
      userId,
      scheduledDate,
      priority,
      isCompleted: false,
      createdAt: new Date(),
      lastUpdateDate: new Date()
    });
  }

  static fromDatabase(data) {
    return new Task({
      id: data.id,
      name: data.name,
      description: data.description,
      scheduledDate: data.scheduled_date,
      createdAt: data.created_at,
      lastUpdateDate: data.last_update_date,
      isCompleted: data.is_completed,
      userId: data.user_id,
      priority: data.priority,
      taskTags: data.task_tags || []
    });
  }
}

module.exports = Task;