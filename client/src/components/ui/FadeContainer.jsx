import React from "react";

const FadeContainer = ({
  children,
  className = ""
}) => {
  return (
    <div
      className={`
        animate-fadeIn
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default FadeContainer;