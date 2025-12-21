"use client";

export default function Card({ 
  children, 
  className = "",
  onClick,
  hover = false,
  ...props 
}) {
  const baseClasses = "bg-white rounded-lg shadow-md p-6";
  const hoverClasses = hover ? "cursor-pointer transition-shadow hover:shadow-lg" : "";
  const classes = `${baseClasses} ${hoverClasses} ${className}`;
  
  return (
    <div
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

