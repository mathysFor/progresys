"use client";

export default function Button({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "",
  type = "button",
  disabled = false,
  ...props 
}) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-[#3B82F6] text-white hover:bg-blue-600 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    gradient: "gradient-primary text-white hover:opacity-90 focus:ring-purple-500",
    outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}

