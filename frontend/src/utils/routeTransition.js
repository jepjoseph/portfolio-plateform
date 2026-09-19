import { flushSync } from "react-dom";

/*
 * =========================================
 * Route Transition Configuration
 * =========================================
 */

export const ROUTE_TRANSITION_DURATION_MS = 1300;

/*
 * =========================================
 * Run Route Transition
 * =========================================
 */

export function runRouteTransition(
  updateRoute,
  { name = "reveal-from-left", duration = ROUTE_TRANSITION_DURATION_MS } = {},
) {
  if (typeof updateRoute !== "function") {
    throw new TypeError("A route update function is required.");
  }

  const root = document.documentElement;

  root.style.setProperty("--route-transition-duration", `${duration}ms`);

  /*
   * Firefox and older browsers may not yet
   * support the View Transitions API.
   */

  if (typeof document.startViewTransition !== "function") {
    updateRoute();

    return null;
  }

  root.dataset.routeTransition = name;

  const transition = document.startViewTransition(() => {
    /*
     * React must render the destination
     * synchronously so the browser can
     * capture its transition snapshot.
     */

    flushSync(() => {
      updateRoute();
    });
  });

  transition.finished.finally(() => {
    delete root.dataset.routeTransition;
  });

  return transition;
}
