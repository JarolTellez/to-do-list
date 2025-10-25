import React from 'react';
import { useLoading } from '../../contexts/LoadingContext';
import '../../styles/components/inline-loader.css';

const InlineLoader = ({ message }) => {
  const { isInlineLoading, inlineMessage } = useLoading();

  if (!isInlineLoading) return null;

  const displayMessage = message || inlineMessage;

  return (
    <div className="inline-loader">
      <div className="inline-spinner"></div>
      {displayMessage && <span className="inline-message">{displayMessage}</span>}
    </div>
  );
};

export default InlineLoader;