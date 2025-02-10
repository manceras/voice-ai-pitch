import React, { useState, useEffect } from 'react';

const CircleVisualizer = ({ amplitude, activeMode, mediaVisible }) => {
  // Base sizes.
  const minSize = 50;
  const maxSizeNormal = 250; // When centered.
  const maxSizeCorner = 150; // When in the corner.
  
  // Use a smaller maximum when visual media is visible.
  const effectiveMaxSize = mediaVisible ? maxSizeCorner : maxSizeNormal;
  
  // Exaggerate the amplitude using a logarithmic scale.
  let amplitudeFactor = Math.log2(amplitude * 0.07 * 1000);
  amplitudeFactor = amplitudeFactor > 0 ? amplitudeFactor : 0;
  
  // Compute the current size using the effective maximum.
  const size = minSize + amplitudeFactor * (effectiveMaxSize - minSize);
  
  // Determine the circle's color.
  const color = activeMode === 'speaker' ? '#9e77ed' : '#717680';
  
  // Store an offset to use in the transform.
  // We compute this offset only when mediaVisible changes (so it doesn't jitter as the size changes).
  const [offset, setOffset] = useState({ diffX: 0, diffY: 0 });
  
  useEffect(() => {
    if (mediaVisible) {
      const margin = 20;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Compute target center position for the circle in the corner using effectiveMaxSize.
      const targetX = window.innerWidth - margin - effectiveMaxSize / 2;
      const targetY = window.innerHeight - margin - effectiveMaxSize / 2;
      const diffX = targetX - centerX;
      const diffY = targetY - centerY;
      setOffset({ diffX, diffY });
    } else {
      setOffset({ diffX: 0, diffY: 0 });
    }
  }, [mediaVisible, effectiveMaxSize]);
  
  // Compute the transform based on the stored offset.
  const transform = mediaVisible
    ? `translate(calc(-50% + ${offset.diffX}px), calc(-50% + ${offset.diffY}px))`
    : 'translate(-50%, -50%)';
  
  const circleStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: color,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: transform,
    zIndex: 1000,
    // Animate transform (for position) as well as size and background-color.
    transition: 'transform 1s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, background-color 0.3s ease-in-out'
  };
  
  return <div style={circleStyle} />;
};

export default CircleVisualizer;
