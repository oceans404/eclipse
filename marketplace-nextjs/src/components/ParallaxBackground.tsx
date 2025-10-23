'use client';

import { useEffect } from 'react';

export function ParallaxBackground() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const layers = document.querySelectorAll('.parallax-layer');
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      layers.forEach((layer) => {
        const speed = parseFloat(layer.getAttribute('data-speed') || '0');
        const x = (e.clientX - centerX) * speed;
        const y = (e.clientY - centerY) * speed;

        (layer as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
      <div
        className="parallax-layer absolute rounded-full opacity-25 transition-transform duration-300 ease-out"
        data-speed="0.15"
        style={{
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, #D97757 0%, transparent 70%)',
          top: '-200px',
          right: '-200px',
        }}
      />
      <div
        className="parallax-layer absolute rounded-full opacity-25 transition-transform duration-300 ease-out"
        data-speed="0.3"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, #1a1a1a 0%, transparent 70%)',
          bottom: '-100px',
          left: '-100px',
        }}
      />
      <div
        className="parallax-layer absolute rounded-full opacity-25 transition-transform duration-300 ease-out"
        data-speed="0.5"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, #D97757 0%, transparent 70%)',
          top: '50%',
          left: '30%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className="parallax-layer absolute rounded-full opacity-25 transition-transform duration-300 ease-out"
        data-speed="0.2"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, #1a1a1a 0%, transparent 70%)',
          top: '20%',
          right: '20%',
        }}
      />
    </div>
  );
}
