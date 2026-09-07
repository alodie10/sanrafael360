const listeners = new Set<(open: boolean) => void>();
let searchExpanded = false;

export function setMobileSearchExpanded(open: boolean) {
  if (searchExpanded === open) return;
  searchExpanded = open;
  listeners.forEach((listener) => listener(open));
}

export function subscribeMobileSearchExpanded(listener: (open: boolean) => void) {
  listeners.add(listener);
  listener(searchExpanded);
  return () => {
    listeners.delete(listener);
  };
}
