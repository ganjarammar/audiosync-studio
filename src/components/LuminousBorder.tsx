import { useEffect, useRef, useState } from "react";

interface LuminousBorderProps {
  children: React.ReactNode;
  active: boolean;
  className?: string;
}

export function LuminousBorder({ children, active, className = "" }: LuminousBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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
  const rx = height / 2; // Pill shape radius
  const strokeWidth = 2;
  const padding = 2;
  
  // SVG dimensions slightly larger than the button
  const svgWidth = width + padding * 2;
  const svgHeight = height + padding * 2;
  
  // Rounded rect path for the pill shape
  const pathLength = 200; // Normalized for animation

  return (
    <div ref={containerRef} className={`relative ${className}`}>
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
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
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
            filter="url(#glow)"
          />
        </svg>
      )}
      {children}
    </div>
  );
}
