import React from 'react';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

const InfiniteScrollList = ({
  items,
  renderItem,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  emptyMessage = "No hay elementos para mostrar",
  loadingMessage = "Cargando...",
  loadingMoreMessage = "Cargando más elementos...",
  className = "",
  listClassName = "",
}) => {
  const { setObserverRef } = useInfiniteScroll(onLoadMore, hasMore, loadingMore);

  if (loading && items.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{loadingMessage}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-message">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`infinite-scroll-list ${className}`}>
      <div className={listClassName}>
        {items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem(item)}
          </div>
        ))}
      </div>
      {hasMore && (
        <div ref={setObserverRef} className="scroll-detector" />
      )}
      
      {loadingMore && (
        <div className="footer-message">
          <div className="spinner-small"></div>
          <p style={{ marginTop: '10px' }}>{loadingMoreMessage}</p>
        </div>
      )}
      
      {!hasMore && items.length > 0 && (
        <div className="footer-message">
          No hay más elementos para mostrar
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollList;