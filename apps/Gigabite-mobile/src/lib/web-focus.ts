export function blurActiveWebElement() {
  if (typeof document === 'undefined') {
    return;
  }

  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}
