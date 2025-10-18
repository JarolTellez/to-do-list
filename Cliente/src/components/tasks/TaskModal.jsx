import React, { useState, useEffect } from 'react';
import TagInput from '../common/TagInput';
import { formatDateForDateTimeInput } from '../../utils/formatDate';
import { taskMappers } from '../../mappers/taskMapper';
import { useToast } from '../../components/contexts/ToastContexts';

const TaskModal = ({ task, onClose, onSave, onDelete, isEditing, loading: externalLoading }) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scheduledDate: '',
    priority: ''
  });
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        scheduledDate: task.scheduledDate ? formatDateForDateTimeInput(new Date(task.scheduledDate)) : '',
        priority: task.priority?.toString() || ''
      });


      if (task.tags && task.tags.length > 0) {
        setTags(task.tags);
      } else {
        setTags([]);
      }
      
    } else {
      setFormData({
        name: '',
        description: '',
        scheduledDate: '',
        priority: ''
      });
      setTags([]);
    }
    
    setNameError('');
    setDescriptionError('');
  }, [task]);

  const validateForm = () => {
    let isValid = true;
    
    if (!formData.name.trim()) {
      setNameError('El título es obligatorio');
      isValid = false;
    } else if (formData.name.length > 50) {
      setNameError('El título no puede superar 50 caracteres');
      isValid = false;
    } else {
      setNameError('');
    }

    if (formData.description.length > 255) {
      setDescriptionError('La descripción no puede superar 255 caracteres');
      isValid = false;
    } else {
      setDescriptionError('');
    }

    return isValid;
  };

  const handlePriorityChange = (priorityNumber) => {
    setFormData(prev => ({
      ...prev,
      priority: prev.priority === priorityNumber.toString() ? '' : priorityNumber.toString()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const formTaskData = {
        id: isEditing ? task.id : undefined,
        name: formData.name.trim(),
        description: formData.description.trim(),
        scheduledDate: formData.scheduledDate || null,
        priority: formData.priority ? parseInt(formData.priority) : null,
        userId: isEditing ? task.userId : parseInt(sessionStorage.getItem('userId')),
        tags: tags, 
        isCompleted: isEditing ? task.isCompleted : false,
        createdAt: isEditing ? task.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let taskToSave;
      
      if (isEditing) {
        taskToSave = taskMappers.inputToTask(formTaskData);
        taskToSave.validateForUpdate();
      } else {
        taskToSave = taskMappers.inputToTask(formTaskData);
        taskToSave.validateForCreation();
      }

      await onSave(taskToSave);
      
    } catch (error) {
      console.error(`Error en ${isEditing ? 'actualización' : 'creación'} de tarea:`, error);
      
      if (Array.isArray(error)) {
        const firstError = error[0];
        showToast(`Error de validación: ${firstError.message}`, 'error', 6000);
      } else {
        const errorMessage = error.message || `Error al ${isEditing ? 'actualizar' : 'crear'} la tarea`;
        showToast(errorMessage, 'error', 6000);
      }
      
      setNameError('');
      setDescriptionError('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }

    setLoading(true);
    try {
      await onDelete(task.id);
    } catch (error) {
      showToast('Error al eliminar la tarea', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (isEditing) {
      handleDelete();
    } else {
      setFormData({
        name: '',
        description: '',
        scheduledDate: '',
        priority: ''
      });
      setTags([]);
      setNameError('');
      setDescriptionError('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'name') setNameError('');
    if (name === 'description') setDescriptionError('');
  };

  const isLoading = loading || externalLoading;

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-form-container">
            <div className="modal-inputs-container">
              <input 
                type="text" 
                className="modal-task-name" 
                name="name"
                maxLength="50" 
                placeholder="Título de la tarea" 
                value={formData.name}
                onChange={handleInputChange}
                required 
                disabled={isLoading}
              />
              {nameError && <p className="modal-error-message">{nameError}</p>}
              
              <textarea 
                className="modal-task-description" 
                name="description"
                maxLength="255" 
                placeholder="Descripción"
                value={formData.description}
                onChange={handleInputChange}
                disabled={isLoading}
                rows="3"
              />
              {descriptionError && <p className="modal-error-message">{descriptionError}</p>}

              <label className="modal-label">Fecha programada</label>
              <input 
                type="datetime-local" 
                className="modal-datetime-input"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                min={formatDateForDateTimeInput(new Date())}
                disabled={isLoading}
              />
            </div>

            <div className="modal-tags-section">
              <label className="modal-label">Etiquetas</label>
              <TagInput 
                selectedTags={tags}
                onTagsChange={setTags}
                disabled={isLoading}
              />
            </div>

            <div className="modal-priority-container">
              <label className="modal-label">Nivel de Prioridad</label>
              <div className="modal-priority-selector">
                {[1, 2, 3, 4, 5].map(num => (
                  <label key={num} className="modal-priority-option">
                    <input 
                      type="checkbox"
                      name="priority" 
                      value={num.toString()}
                      checked={formData.priority === num.toString()}
                      onChange={() => !isLoading && handlePriorityChange(num)}
                      disabled={isLoading}
                      style={{ display: 'none' }}
                    />
                    <span 
                      className={`modal-priority-label ${formData.priority === num.toString() ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                    >
                      {num}
                    </span>
                  </label>
                ))}
              </div>
           
            </div>

            <div className="modal-buttons-container">
              <button 
                type="submit" 
                className="modal-add-btn" 
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Tarea' : 'Crear Tarea')}
              </button>
              
              <button 
                type="button" 
                className="modal-cancel-btn" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </button>
              
              <button 
                type="button" 
                className={isEditing ? "modal-delete-btn" : "modal-clear-btn"} 
                onClick={handleClear}
                disabled={isLoading}
              >
                {isEditing ? 'Eliminar Tarea' : 'Limpiar Formulario'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;