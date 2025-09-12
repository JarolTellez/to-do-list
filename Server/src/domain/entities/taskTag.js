const {ValidationError}=require('../../utils/appErrors');
const errorCodes = require('../../utils/errorCodes');
const Tag = require('../entities/tag');
const Task = require('../entities/task');

class TaskTag{
  #id;
  #taskId;
  #tagId;
  #createdAt;
  #tag;
  #task;

    constructor({id=null, taskId, tagId, createdAt= new Date(),tag=null, task=null}) {
        this.#id = id;
        this.#taskId = taskId;
        this.#tagId = tagId;
        this.#createdAt = createdAt;
        this.#task = task;
        this.#tag = tag;

        this.validate();
      }

        assignTag(tag) {
    if (!(tag instanceof Tag)) {
      throw new ValidationError('Must provide an instance of Tag');
    }
      if (this.#tagId && this.#tagId !== tag.id) {
     throw new ValidationError('The assigned tag does not match the existing tagId');
  }
    this.#tag = tag;
    this.#tagId = tag.id;
  }

   assignTask(task) {
    if (!(task instanceof Task)) {
    throw new ValidationError('Must provide an instance of Task');
    }
    this.#task = task;
    this.#taskId = task.id;
  }


  // validations
  validate() {
    const errors = [];
    
    if (!this.#taskId) {
      errors.push({ field: 'taskId', message: 'Task ID is required' });
    }
    
    if (!this.#tagId) {
      errors.push({ field: 'tagId', message: 'Tag ID is required' });
    }
    
    if (errors.length > 0) {
       throw new ValidationError('Invalid TaskTag data', errors);
    }
  }

  // === GETTERS ===
  get id() { return this.#id; }
  get taskId() { return this.#taskId; }
  get tagId() { return this.#tagId; }
  get createdAt() { return this.#createdAt; }
  get tag() { return this.#tag; }
  get task() { return this.#task; }

  // === MÉTODOS DE CONSULTA ===
  isRecent(hours = 24) {
    const hoursDiff = (new Date() - this.#createdAt) / (1000 * 60 * 60);
    return hoursDiff <= hours;
  }

  hasTag() {
    return this.#tag !== null && this.#tag !== undefined;
  }

  hasTask() {
    return this.#task !== null && this.#task !== undefined;
  }

  toJSON() {
    return {
      id: this.#id,
      taskId: this.#taskId,
      tagId: this.#tagId,
      createdAt: this.#createdAt,
      tag: this.#tag ? (this.#tag.toJSON ? this.#tag.toJSON() : this.#tag) : null,
      task: this.#task ? (this.#task.toJSON ? this.#task.toJSON() : this.#task) : null,
      isRecent: this.isRecent()
    };
  }

  // statics
  static create({ taskId, tagId, task = null, tag = null }) {
    return new TaskTag({
      taskId,
      tagId,
      task,
      tag,
      createdAt: new Date()
    });
  }

  static fromDatabase(data) {
    return new TaskTag({
      id: data.id,
      taskId: data.task_id,
      tagId: data.tag_id,
      createdAt: data.created_at,
      tag: data.tag || null,
      task: data.task || null
    });
  }

  static assign({ task, tag }) {
    if (!task || !tag) {
       throw new ValidationError('Task and Tag are required for assignment');
    }
    
    return new TaskTag({
      taskId: task.id,
      tagId: tag.id,
      task,
      tag,
      createdAt: new Date()
    });
  }
}

module.exports = TaskTag;