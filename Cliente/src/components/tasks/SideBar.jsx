import React from 'react';

const Sidebar = ({ 
  stats, 
  filter, 
  priorityFilter, 
  dateFilter, 
  onFilterChange, 
  onPriorityFilterChange, 
  onDateFilterChange,
  onRefresh,
  onClearAll,
  hasActiveFilters
}) => {
  
  return (
    <aside className="sidebar">
      <div className="sidebar-actions">
        <button onClick={onRefresh} className="action-btn refresh-action" title="Sincronizar con base de datos">
          Actualizar BD
        </button>
        
        {hasActiveFilters && (
          <button onClick={onClearAll} className="action-btn clear-action" title="Limpiar todos los filtros">
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="filters">
        <h3>Filtrar Tareas</h3>
      
        <div className="filter-item">
          <label>Estado</label>
          <div className="filter-container">
            <button 
              type="button"
              className={`toggle-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => onFilterChange('pending')}
            >
              Pendientes
            </button>
            <button 
              type="button"
              className={`toggle-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => onFilterChange('completed')}
            >
              Completadas
            </button>
            <button 
              type="button"
              className={`toggle-btn ${filter === 'overdue' ? 'active' : ''}`}
              onClick={() => onFilterChange('overdue')}
            >
              Vencidas
            </button>
          </div>
        </div>

    
        <div className="filter-item">
          <label>Ordenar por Prioridad</label>
          <div className="filter-container">
            <button 
              type="button"
              className={`toggle-btn ${priorityFilter === 'highest' ? 'active' : ''}`}
              onClick={() => onPriorityFilterChange('highest')}
            >
              Mayor
            </button>
            <button 
              type="button"
              className={`toggle-btn ${priorityFilter === 'lowest' ? 'active' : ''}`}
              onClick={() => onPriorityFilterChange('lowest')}
            >
              Menor
            </button>
          </div>
        </div>

   
        <div className="filter-item">
          <label>Filtrar por Fecha</label>
          <div className="filter-container">
            <button 
              type="button"
              className={`toggle-btn ${dateFilter === 'today' ? 'active' : ''}`}
              onClick={() => onDateFilterChange('today')}
            >
              Para Hoy
            </button>
            <button 
              type="button"
              className={`toggle-btn ${dateFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => onDateFilterChange('upcoming')}
            >
              Próximas
            </button>
          </div>
        </div>

      </div>

  
      <div className="statistics">
        <h3>Estadísticas</h3>
        <div className="statistic-item">
          <p>Total</p>
          <p>{stats.total}</p>
        </div>
        <div className="statistic-item completed-statistics">
          <p>Completadas</p>
          <p>{stats.completedCount}</p>
        </div>
        <div className="statistic-item pending-statistics">
          <p>Pendientes</p>
          <p>{stats.pendingCount}</p>
        </div>
        <div className="statistic-item overdue-statistics">
          <p>Vencidas</p>
          <p>{stats.overdueCount || 0}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;