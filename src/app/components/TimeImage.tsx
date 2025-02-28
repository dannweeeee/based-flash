'use client';

import { useEffect, useRef } from 'react';

interface TimeImageProps {
  time: number;
  width?: number;
  height?: number;
  onImageGenerated?: (imageUrl: string) => void;
}

export default function TimeImage({ time, width = 500, height = 500, onImageGenerated }: TimeImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Create a clean gradient blue background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0066ff');
    gradient.addColorStop(1, '#0044cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw time text with subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'white';
    
    // Use a more modern font stack
    ctx.font = '600 56px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${time} ms`, canvas.width / 2, canvas.height / 2 - 20);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw text with a more minimalist style
    ctx.font = '500 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Flashblocks NFT', canvas.width / 2, canvas.height / 2 + 40);
    
    ctx.font = '400 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Base Sepolia', canvas.width / 2, canvas.height / 2 + 80);
    
    // Call the callback with the image URL if provided
    if (onImageGenerated) {
      onImageGenerated(canvas.toDataURL('image/png'));
    }
  }, [time, width, height, onImageGenerated]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      className="w-full h-auto rounded-lg shadow-lg"
    />
  );
}
