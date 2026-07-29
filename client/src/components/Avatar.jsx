import React from "react";

const colors = [
  "rgb(var(--color-avatar-1))",
  "rgb(var(--color-avatar-2))",
  "rgb(var(--color-avatar-3))",
  "rgb(var(--color-avatar-4))",
  "rgb(var(--color-avatar-5))",
];

const initials = (name = "?") => {
  const safeName = String(name || "?").trim();

  if (!safeName) {
    return "?";
  }

  return safeName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const colorFor = (seed = "") => {
  const safeSeed = String(seed || "?");

  const index =
    safeSeed.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0) % colors.length;

  return colors[index];
};

const Avatar = ({
  src,
  name = "User",
  size = 40,
  className = "",
}) => {
  const safeSize = Number(size) || 40;

  const dimensions = {
    width: `${safeSize}px`,
    height: `${safeSize}px`,
    minWidth: `${safeSize}px`,
    minHeight: `${safeSize}px`,
  };

  if (src) {
    return (
      <img
        src={src}
        alt={`${name}'s avatar`}
        style={dimensions}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        ...dimensions,
        background: colorFor(name),
      }}
      className={`rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden text-bg font-display font-semibold select-none ${className}`}
      aria-label={`${name}'s avatar`}
    >
      <span
        style={{
          fontSize: `${Math.max(safeSize * 0.4, 10)}px`,
          lineHeight: 1,
        }}
      >
        {initials(name)}
      </span>
    </div>
  );
};

export default Avatar;