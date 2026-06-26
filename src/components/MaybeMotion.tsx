import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface MaybeMotionProps extends HTMLMotionProps<any> {
  as?: any;
  lowDataMode?: boolean;
}

/**
 * A wrapper around Framer Motion's motion components that conditionally disables animations
 * completely when lowDataMode is true, rendering a plain HTML element instead.
 * This is crucial for performance on low-end devices and slow networks.
 */
export const MaybeMotion = React.forwardRef<any, MaybeMotionProps>(
  ({ as = 'div', lowDataMode, children, ...props }, ref) => {
    if (lowDataMode) {
      // Use the raw HTML tag name (e.g., 'div' instead of 'motion.div' or 'div' string)
      const Component = as as any;
      
      // Strip out all Framer Motion specific properties to avoid React warnings
      const {
        initial, animate, exit, transition, variants, whileHover, whileTap,
        whileDrag, whileFocus, whileInView, layout, layoutId, drag, dragConstraints,
        dragElastic, dragMomentum, onPan, onPanStart, onPanEnd, onPanSessionStart,
        onTap, onTapStart, onTapCancel, onHoverStart, onHoverEnd, hoverCursor,
        onViewportEnter, onViewportLeave, viewport, layoutScroll, layoutRoot,
        onLayoutAnimationStart, onLayoutAnimationComplete, onUpdate, onAnimationStart,
        onAnimationComplete, onDragStart, onDrag, onDragEnd, onDirectionLock,
        onMeasureDragConstraints, custom, style, transformTemplate, ...safeProps
      } = props as any;

      // Retain style but remove motion values if any are accidentally passed
      const safeStyle = { ...style };
      
      return (
        <Component ref={ref} style={safeStyle} {...safeProps}>
          {children}
        </Component>
      );
    }

    // Default to motion.div if 'as' isn't explicitly defined as a motion component
    const MotionComponent = (motion as any)[as as string] || motion.div;
    
    return (
      <MotionComponent ref={ref} {...props}>
        {children}
      </MotionComponent>
    );
  }
);

MaybeMotion.displayName = 'MaybeMotion';
