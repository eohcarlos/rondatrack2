import { useState, useEffect, useRef } from 'react';

export const useCountAnimation = (endValue: number, duration: number = 1000, startOnMount: boolean = true) => {
  const [count, setCount] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!startOnMount || hasAnimatedRef.current) return;
    
    hasAnimatedRef.current = true;
    const startValue = 0;
    const difference = endValue - startValue;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuart for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.floor(startValue + difference * easeOutQuart);
      setCount(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    // Small delay before starting animation
    const timeout = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [endValue, duration, startOnMount]);

  // Reset animation when endValue changes significantly
  useEffect(() => {
    if (hasAnimatedRef.current && endValue !== count) {
      setCount(endValue);
    }
  }, [endValue]);

  return count;
};

export const useCurrencyAnimation = (endValue: number, duration: number = 1200) => {
  const count = useCountAnimation(endValue, duration);
  
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(count);
};
