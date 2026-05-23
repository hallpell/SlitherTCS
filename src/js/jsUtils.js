export function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    // Clear the previous timer if it exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Start a new timer
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

export function debouncedObjFactory(fn, delay) {
  let timer = null;

  return {
    run(...args) {
      clearTimeout(timer);

      timer = setTimeout(() => {
        fn(...args);
        timer = null;
      }, delay);
    },

    flush(...args) {
      clearTimeout(timer);
      timer = null;

      fn(...args);
    },

    cancel() {
      clearTimeout(timer);
      timer = null;
    }
  };
}
