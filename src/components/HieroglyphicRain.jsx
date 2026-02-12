import React, { useEffect, useState } from 'react';

export default function HieroglyphicRain() {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Egyptian-style hieroglyphic characters
    const hieroglyphs = [
      '𓀀', '𓀁', '𓀂', '𓀃', '𓀄', '𓀅', '𓀆', '𓀇', '𓀈', '𓀉',
      '𓀊', '𓀋', '𓀌', '𓀍', '𓀎', '𓀏', '𓀐', '𓀑', '𓀒', '𓀓',
      '𓀔', '𓀕', '𓀖', '𓀗', '𓀘', '𓀙', '𓀚', '𓀛', '𓀜', '𓀝',
      '𓁀', '𓁁', '𓁂', '𓁃', '𓁄', '𓁅', '𓁆', '𓁇', '𓁈', '𓁉',
      '𓂀', '𓂁', '𓂂', '𓂃', '𓂄', '𓂅', '𓂆', '𓂇', '𓂈', '𓂉'
    ];

    const columns = Math.ceil(canvas.width / 20);
    const drops = Array(columns).fill(0).map((_, i) => ({
      x: i * 20,
      y: Math.random() * canvas.height,
      speed: Math.random() * 2 + 1,
      char: hieroglyphs[Math.floor(Math.random() * hieroglyphs.length)],
      opacity: Math.random() * 0.5 + 0.3
    }));

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drops.forEach((drop) => {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = `rgba(34, 197, 94, ${drop.opacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
        ctx.shadowBlur = 8;
        
        ctx.fillText(drop.char, drop.x, drop.y);

        drop.y += drop.speed;

        if (drop.y > canvas.height) {
          drop.y = -20;
          drop.char = hieroglyphs[Math.floor(Math.random() * hieroglyphs.length)];
          drop.opacity = Math.random() * 0.5 + 0.3;
          drop.speed = Math.random() * 2 + 1;
        }
      });

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-30 top-0 left-0"
      style={{ zIndex: 2 }}
    />
  );
}