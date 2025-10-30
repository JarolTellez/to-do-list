import { useState, useEffect, useCallback, useRef } from "react";

export const useInfiniteScroll = (
  loadMore,
  hasMore,
  loadingMore,
  threshold = 0.1,
  scrollContainerRef = null
) => {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const observerRef = useRef();

  const checkIsNearBottom = useCallback(() => {
    if (scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      return scrollPercentage > 1 - threshold;
    } else {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      return scrollPercentage > 1 - threshold;
    }
  }, [scrollContainerRef, threshold]);

  const handleScroll = useCallback(() => {
    if (checkIsNearBottom() && hasMore && !loadingMore) {
      setIsNearBottom(true);
    } else {
      setIsNearBottom(false);
    }
  }, [checkIsNearBottom, hasMore, loadingMore]);

  useEffect(() => {
    const scrollElement = scrollContainerRef?.current || window;
    
    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [handleScroll, scrollContainerRef]);

  useEffect(() => {
    if (isNearBottom && hasMore && !loadingMore) {
      loadMore();
      setIsNearBottom(false);
    }
  }, [isNearBottom, hasMore, loadingMore, loadMore]);

  const setObserverRef = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node && hasMore && !loadingMore) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore && !loadingMore) {
              loadMore();
            }
          },
          { 
            threshold,
            root: scrollContainerRef?.current || null,
             rootMargin: "0px 0px 100px 0px"
          }
        );
        observerRef.current.observe(node);
      }
    },
    [hasMore, loadingMore, loadMore, threshold, scrollContainerRef]
  );

  return { setObserverRef };
};