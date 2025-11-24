'use client'
export default function Loading() {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="modern-spinner"></div>
        <style jsx>{`
          /* The CSS must be included or imported globally */
          .modern-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-top: 4px solid #3498db; /* A modern blue color */
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
  
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }