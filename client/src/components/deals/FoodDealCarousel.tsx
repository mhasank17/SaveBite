import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FoodDeal } from '../../types';
import DealCard from './DealCard';

export interface FoodDealCarouselProps {
  title: string;
  badge?: string;
  subtitle?: string;
  deals: FoodDeal[];
  onSelectDeal: (deal: FoodDeal) => void;
  onViewAll?: () => void;
  viewAllText?: string;
  className?: string;
  testId?: string;
}

export const FoodDealCarousel: React.FC<FoodDealCarouselProps> = ({
  title,
  badge,
  subtitle,
  deals,
  onSelectDeal,
  onViewAll,
  viewAllText = 'View all',
  className = '',
  testId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Number of pagination dots (capped at max 6 for a clean, balanced UI)
  const maxDots = Math.min(6, Math.max(2, deals.length));

  // Update scroll boundaries & active progress
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      updateScrollState();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState();

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState, deals]);

  // Arrow button navigation
  const handleScrollByDirection = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;

    const firstChild = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstChild ? firstChild.offsetWidth + 16 : 290;
    const scrollAmount = Math.max(cardWidth, Math.floor(el.clientWidth * 0.75));

    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Direct dot jump
  const scrollToDot = (dotIndex: number) => {
    const el = containerRef.current;
    if (!el || maxDots <= 1) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetScroll = (dotIndex / (maxDots - 1)) * maxScroll;
    el.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const firstChild = el.firstElementChild as HTMLElement | null;
    const step = firstChild ? firstChild.offsetWidth + 16 : 290;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      el.scrollBy({ left: -step, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      el.scrollBy({ left: step, behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with main button (left click)
    if (e.button !== 0 || !containerRef.current) return;

    isMouseDownRef.current = true;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftStartRef.current = containerRef.current.scrollLeft;
    hasDraggedRef.current = false;
    lastXRef.current = e.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;

    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = x - startXRef.current;

    if (Math.abs(walk) > 5) {
      if (!isDragging) setIsDragging(true);
      hasDraggedRef.current = true;

      // Track velocity for flick momentum
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current = (e.pageX - lastXRef.current) / dt;
      }
      lastXRef.current = e.pageX;
      lastTimeRef.current = now;

      // 1:1 responsive tracking without rubberband fight
      containerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    }
  };

  const endDrag = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    setIsDragging(false);

    if (containerRef.current && hasDraggedRef.current) {
      const v = velocityRef.current;
      if (Math.abs(v) > 0.25) {
        // Natural momentum flick
        const momentum = -v * 240;
        containerRef.current.scrollBy({ left: momentum, behavior: 'smooth' });
      }
    }
  };

  // Prevent card click if the user was dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      // Reset flag after event bubbling finishes
      requestAnimationFrame(() => {
        hasDraggedRef.current = false;
      });
    }
  };

  if (!deals || deals.length === 0) {
    return null;
  }

  return (
    <section className={`flex flex-col gap-2.5 ${className}`} data-testid={testId}>
      {/* Header with Title, Badge, Controls & View All */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs md:text-sm font-bold tracking-wider text-slate-500 uppercase">
              {title}
            </h3>
            {badge && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Arrow navigation buttons (desktop/tablet helper) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScrollByDirection('left')}
              disabled={!canScrollLeft}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                canScrollLeft
                  ? 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-[#006030] hover:border-emerald-300 shadow-xs active:scale-95'
                  : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
              }`}
              aria-label={`Scroll ${title} deals left`}
            >
              <span className="material-symbols-outlined text-[18px] select-none leading-none">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => handleScrollByDirection('right')}
              disabled={!canScrollRight}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                canScrollRight
                  ? 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-[#006030] hover:border-emerald-300 shadow-xs active:scale-95'
                  : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
              }`}
              aria-label={`Scroll ${title} deals right`}
            >
              <span className="material-symbols-outlined text-[18px] select-none leading-none">chevron_right</span>
            </button>
          </div>

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs md:text-sm font-semibold text-[#006030] hover:underline flex items-center gap-0.5 ml-1 shrink-0"
            >
              <span>{viewAllText}</span>
              <span>›</span>
            </button>
          )}
        </div>
      </div>

      {/* Swipeable & Draggable Track */}
      <div
        ref={containerRef}
        role="region"
        tabIndex={0}
        aria-label={`${title} food deals carousel. Drag or use arrow keys to navigate.`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={handleClickCapture}
        onKeyDown={handleKeyDown}
        className={`flex gap-4 overflow-x-auto pb-3 pt-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-y overscroll-x-contain select-none focus-visible:ring-2 focus-visible:ring-[#006030]/30 outline-none rounded-2xl ${
          isDragging
            ? 'cursor-grabbing scroll-auto snap-none'
            : 'cursor-grab scroll-smooth snap-x snap-mandatory'
        }`}
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            horizontal
            onClick={onSelectDeal}
            onReserve={onSelectDeal}
          />
        ))}
      </div>

      {/* Pagination Dots / Progress Indicator */}
      {maxDots > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 pt-1"
          aria-hidden="true"
        >
          {Array.from({ length: maxDots }).map((_, idx) => {
            const activeDotIndex =
              maxDots > 1
                ? Math.min(
                    maxDots - 1,
                    Math.max(0, Math.round(scrollProgress * (maxDots - 1)))
                  )
                : 0;
            return (
              <button
                key={`dot-${idx}`}
                type="button"
                onClick={() => scrollToDot(idx)}
                aria-label={`Go to slide group ${idx + 1} of ${maxDots}`}
                className={`transition-all duration-300 rounded-full focus-visible:ring-2 focus-visible:ring-[#006030] outline-none ${
                  activeDotIndex === idx
                    ? 'w-6 h-1.5 bg-[#006030]'
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FoodDealCarousel;
