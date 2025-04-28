// src/components/ui/card.jsx
export function Card({ children, className, ...props }) {
    return <div className={`rounded-xl bg-white/5 p-4 ${className}`} {...props}>{children}</div>;
  }
  
  export function CardHeader({ children, className }) {
    return <div className={`mb-2 ${className}`}>{children}</div>;
  }
  
  export function CardTitle({ children, className }) {
    return <h3 className={`text-xl font-bold ${className}`}>{children}</h3>;
  }
  
  export function CardDescription({ children, className }) {
    return <p className={`text-sm text-gray-400 ${className}`}>{children}</p>;
  }
  
  export function CardContent({ children, className }) {
    return <div className={`${className}`}>{children}</div>;
  }
  
  export function CardFooter({ children, className }) {
    return <div className={`mt-2 border-t border-gray-700 pt-2 ${className}`}>{children}</div>;
  }
  