import { useEffect, useRef } from 'react';
import './DynamicGradient.css';

/**
 * DynamicGradient Component
 * Creates animated gradient backgrounds based on a brand color
 * Inspired by react-dynamic-gradient
 * @param {string} brandColor - Hex color code for the brand
 * @param {number} transparency - Opacity value between 0 and 1 (default 0.5)
 */
export default function DynamicGradient({ brandColor = '#4880db', transparency = 0.5, children }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 102, g: 126, b: 234 }; // default purple
    };

    // Generate complementary colors from brand color
    const baseColor = hexToRgb(brandColor);
    
    // Ensure transparency is within valid range
    const alpha = Math.max(0, Math.min(1, transparency));
    
    // Create color variations with user-controlled transparency
    // All variations go from brand color towards white (lighter)
    const colors = [
      // Original brand color (full intensity)
      `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha * 0.9})`,
      // Lighter variant 1 (blend with white)
      `rgba(${Math.round(baseColor.r + (255 - baseColor.r) * 0.3)}, ${Math.round(baseColor.g + (255 - baseColor.g) * 0.3)}, ${Math.round(baseColor.b + (255 - baseColor.b) * 0.3)}, ${alpha * 0.7})`,
      // Lighter variant 2 (more white)
      `rgba(${Math.round(baseColor.r + (255 - baseColor.r) * 0.5)}, ${Math.round(baseColor.g + (255 - baseColor.g) * 0.5)}, ${Math.round(baseColor.b + (255 - baseColor.b) * 0.5)}, ${alpha * 0.6})`,
      // Very light variant (mostly white)
      `rgba(${Math.round(baseColor.r + (255 - baseColor.r) * 0.7)}, ${Math.round(baseColor.g + (255 - baseColor.g) * 0.7)}, ${Math.round(baseColor.b + (255 - baseColor.b) * 0.7)}, ${alpha * 0.5})`,
      // Pure white overlay
      `rgba(255, 255, 255, ${alpha * 0.4})`
    ];

    // Gradient blob positions and velocities
    const blobs = [
      { x: 0.2, y: 0.3, vx: 0.0003, vy: 0.0002, radius: 0.4 },
      { x: 0.8, y: 0.7, vx: -0.0002, vy: 0.0003, radius: 0.5 },
      { x: 0.5, y: 0.5, vx: 0.0002, vy: -0.0002, radius: 0.45 },
      { x: 0.1, y: 0.8, vx: 0.0003, vy: -0.0003, radius: 0.35 },
      { x: 0.9, y: 0.2, vx: -0.0003, vy: 0.0002, radius: 0.4 }
    ];

    const animate = () => {
      time += 0.01;

      // Clear canvas with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set blend mode to prevent darkening when blobs overlap
      ctx.globalCompositeOperation = 'multiply';
      
      // Draw a base layer with very light brand color
      const baseGradient = ctx.createRadialGradient(
        canvas.width * 0.5, 
        canvas.height * 0.5, 
        0,
        canvas.width * 0.5, 
        canvas.height * 0.5, 
        Math.max(canvas.width, canvas.height) * 0.7
      );
      baseGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha * 0.15})`);
      baseGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = baseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Reset blend mode for blobs
      ctx.globalCompositeOperation = 'source-over';

      // Update and draw blobs with brand color only - using lighter opacities
      blobs.forEach((blob, i) => {
        // Update position
        blob.x += blob.vx + Math.sin(time + i) * 0.0001;
        blob.y += blob.vy + Math.cos(time + i) * 0.0001;

        // Bounce off edges
        if (blob.x < 0 || blob.x > 1) blob.vx *= -1;
        if (blob.y < 0 || blob.y > 1) blob.vy *= -1;

        // Keep within bounds
        blob.x = Math.max(0, Math.min(1, blob.x));
        blob.y = Math.max(0, Math.min(1, blob.y));

        // Draw radial gradient blob that goes from brand color to transparent
        const gradient = ctx.createRadialGradient(
          blob.x * canvas.width,
          blob.y * canvas.height,
          0,
          blob.x * canvas.width,
          blob.y * canvas.height,
          blob.radius * Math.min(canvas.width, canvas.height)
        );

        // Much lighter opacity to prevent gray from overlapping
        const colorAlpha = alpha * (0.15 + (i * 0.05)); 
        gradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${colorAlpha})`);
        gradient.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${colorAlpha * 0.3})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [brandColor, transparency]);

  return (
    <div className="dynamic-gradient-container">
      <canvas ref={canvasRef} className="dynamic-gradient-canvas" />
      <div className="dynamic-gradient-content">
        {children}
      </div>
    </div>
  );
}

