import React, { useRef } from 'react';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

/**
 * Infinite scroll list component for handling large datasets
 * @component InfiniteScrollList
 * @description Implements infinite scrolling with loading states and empty states
 * @param {Object} props - Component properties
 * @param {Array} props.items - Array of items to render
 * @param {Function} props.renderItem - Function to render individual items
 * @param {boolean} props.loading - Initial loading state
 * @param {boolean} props.loadingMore - Loading more items state
 * @param {boolean} props.hasMore - Whether more items are available
 * @param {Function} props.onLoadMore - Callback to load more items
 * @param {string} props.emptyMessage - Message when no items are available
 * @param {string} props.loadingMessage - Message during initial load
 * @param {string} props.loadingMoreMessage - Message during additional loading
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.listClassName - CSS classes for list container
 * @param {Object} props.scrollContainerRef - Optional scroll container reference
 * @returns {JSX.Element} Infinite scroll list interface
 */
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
  scrollContainerRef = null
}) => {
  const { setObserverRef } = useInfiniteScroll(onLoadMore, hasMore, loadingMore, 0.1, scrollContainerRef);

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
        
        {hasMore && (
          <div 
            ref={setObserverRef} 
            className="scroll-detector"
            style={{ height: '20px', background: 'transparent' }}
          />
        )}
      </div>
      
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