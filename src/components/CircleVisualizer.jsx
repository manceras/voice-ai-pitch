import React, { useState, useEffect } from 'react';

const CircleVisualizer = ({ amplitude, activeMode, mediaVisible, forceCenter, final }) => {
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
  const [offset, setOffset] = useState({ diffX: 0, diffY: 0 });
  
  useEffect(() => {
    if (mediaVisible && !forceCenter) {
      const margin = 20;
      // For bottom center, target x remains centered and y is at the bottom.
      const diffX = 0;
      const targetY = window.innerHeight - margin - effectiveMaxSize / 2;
      const diffY = targetY - window.innerHeight / 2;
      setOffset({ diffX, diffY });
    } else {
      setOffset({ diffX: 0, diffY: 0 });
    }
  }, [mediaVisible, effectiveMaxSize, forceCenter]);
  
  // Compute the transform based on stored offset.
  // If forceCenter is true or there's no media, always center the circle.
  const transform =
    forceCenter || !mediaVisible
      ? 'translate(-50%, -50%)'
      : `translate(calc(-50% + ${offset.diffX}px), calc(-50% + ${offset.diffY}px))`;
  
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
    transition:
      'transform 1s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, background-color 0.3s ease-in-out'
  };
  
  return <div style={circleStyle} />;
};

export default CircleVisualizer;
