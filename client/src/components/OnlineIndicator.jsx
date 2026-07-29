import React from "react";

const OnlineIndicator = ({
  online,
  size = 10,
  className = "",
}) => {
  return (
    <span
      aria-label={online ? "Online" : "Offline"}
      title={online ? "Online" : "Offline"}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      className={`
        inline-block
        flex-shrink-0
        rounded-full
        border-2
        border-sidebar
        transition-colors
        duration-200
        ${
          online
            ? "bg-online animate-breathe"
            : "bg-muted/50"
        }
        ${className}
      `}
    />
  );
};

export default OnlineIndicator;
