import { useEffect, useRef, useState } from "react";

interface LuminousBorderProps {
  children: React.ReactNode;
  active: boolean;
  className?: string;
}

export function LuminousBorder({ children, active, className = "" }: LuminousBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  const { width, height } = dimensions;
  const rx = height / 2;
  const strokeWidth = 2;
  const padding = 16;
  
  const svgWidth = width + padding * 2;
  const svgHeight = height + padding * 2;
  
  const pathLength = 200;

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {active && width > 0 && height > 0 && (
        <svg
          className="absolute pointer-events-none"
          style={{
            left: -padding,
            top: -padding,
            width: svgWidth,
            height: svgHeight,
          }}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          fill="none"
        >
          <defs>
            <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur1" />
              <feGaussianBlur stdDeviation="6" result="blur2" />
              <feGaussianBlur stdDeviation="10" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            x={padding + strokeWidth / 2}
            y={padding + strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            rx={rx - strokeWidth / 2}
            ry={rx - strokeWidth / 2}
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            pathLength={pathLength}
            className="luminous-stroke"
            style={{ animationPlayState: isHovered ? 'paused' : 'running' }}
            filter="url(#glow)"
          />
        </svg>
      )}
      {children}
    </div>
  );
}