import { lazy, ComponentType, LazyExoticComponent } from 'react';

export interface PreloadableComponent<T extends ComponentType<any>> extends LazyExoticComponent<T> {
  preload: () => Promise<{ default: T }>;
}

/**
 * Wraps React.lazy with preload capability
 * This allows components to be preloaded before they're actually rendered
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): PreloadableComponent<T> {
  const Component = lazy(factory) as PreloadableComponent<T>;
  Component.preload = factory;
  return Component;
}

/**
 * Preload multiple components at once
 */
export function preloadComponents(components: PreloadableComponent<any>[]): Promise<void> {
  return Promise.all(components.map((component) => component.preload())).then(() => {});
}

/**
 * Preload component on hover
 */
export function preloadOnHover(component: PreloadableComponent<any>) {
  return {
    onMouseEnter: () => component.preload(),
    onFocus: () => component.preload(),
  };
}

/**
 * Preload component when idle
 */
export function preloadWhenIdle(component: PreloadableComponent<any>) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => component.preload());
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => component.preload(), 1);
  }
}
