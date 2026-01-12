interface GemWorkerProps {
  position: 'left' | 'right';
  action: 'idle' | 'cutting' | 'polishing';
  visible: boolean;
}

export function GemWorker({ position, action, visible }: GemWorkerProps) {
  if (!visible) return null;

  const isLeft = position === 'left';
  
  return (
    <div className={`gem-worker ${isLeft ? 'worker-left' : 'worker-right'} ${action}`}>
      <svg viewBox="0 0 100 150" className="worker-svg">
        {/* Worker body */}
        <ellipse cx="50" cy="130" rx="20" ry="10" fill="hsl(var(--muted))" opacity="0.5" />
        
        {/* Legs */}
        <rect x="40" y="100" width="8" height="30" rx="3" fill="hsl(var(--secondary))" />
        <rect x="52" y="100" width="8" height="30" rx="3" fill="hsl(var(--secondary))" />
        
        {/* Body */}
        <rect x="35" y="60" width="30" height="45" rx="5" fill="hsl(var(--primary))" />
        
        {/* Head */}
        <circle cx="50" cy="45" r="18" fill="hsl(var(--muted-foreground))" />
        
        {/* Safety goggles */}
        <rect x="35" y="40" width="30" height="10" rx="3" fill="hsl(var(--secondary))" />
        <circle cx="42" cy="45" r="5" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="1" />
        <circle cx="58" cy="45" r="5" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="1" />
        
        {/* Arm with tool */}
        <g className={`worker-arm ${action === 'cutting' ? 'chisel-swing' : action === 'polishing' ? 'polish-motion' : ''}`}>
          {/* Upper arm */}
          <rect 
            x={isLeft ? "60" : "20"} 
            y="65" 
            width="25" 
            height="10" 
            rx="4" 
            fill="hsl(var(--primary))"
            transform={isLeft ? "rotate(-20 65 70)" : "rotate(20 35 70)"}
          />
          
          {/* Forearm */}
          <rect 
            x={isLeft ? "78" : "5"} 
            y="58" 
            width="20" 
            height="8" 
            rx="3" 
            fill="hsl(var(--muted-foreground))"
            transform={isLeft ? "rotate(-40 88 62)" : "rotate(40 12 62)"}
          />
          
          {/* Tool */}
          {action === 'cutting' && (
            <g transform={isLeft ? "translate(85, 45) rotate(-30)" : "translate(-5, 45) rotate(30)"}>
              {/* Chisel handle */}
              <rect x="0" y="0" width="8" height="25" rx="2" fill="#8B4513" />
              {/* Chisel blade */}
              <polygon points="0,25 8,25 4,35" fill="hsl(var(--muted-foreground))" />
            </g>
          )}
          
          {action === 'polishing' && (
            <g transform={isLeft ? "translate(82, 50)" : "translate(0, 50)"}>
              {/* Polishing cloth */}
              <ellipse cx="8" cy="5" rx="12" ry="6" fill="hsl(var(--accent))" opacity="0.8" />
            </g>
          )}
        </g>
        
        {/* Static arm */}
        <rect 
          x={isLeft ? "20" : "55"} 
          y="70" 
          width="18" 
          height="8" 
          rx="3" 
          fill="hsl(var(--primary))"
        />
      </svg>
      
      {/* Sparks during cutting */}
      {action === 'cutting' && (
        <div className="sparks-container">
          <div className="spark spark-1" />
          <div className="spark spark-2" />
          <div className="spark spark-3" />
          <div className="spark spark-4" />
          <div className="spark spark-5" />
        </div>
      )}
    </div>
  );
}
