import { useState, useEffect, useCallback, useRef } from "react";

export const useInfiniteScroll = (
  loadMore,
  hasMore,
  loadingMore,
  threshold = 0.1
) => {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const observerRef = useRef();

  const checkIsNearBottom = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    return scrollPercentage > 1 - threshold;
  }, [threshold]);

  const handleScroll = useCallback(() => {
    if (checkIsNearBottom() && hasMore && !loadingMore) {
      setIsNearBottom(true);
    } else {
      setIsNearBottom(false);
    }
  }, [checkIsNearBottom, hasMore, loadingMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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
          { threshold }
        );
        observerRef.current.observe(node);
      }
    },
    [hasMore, loadingMore, loadMore, threshold]
  );

  return { setObserverRef };
};
