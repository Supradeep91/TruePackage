export function useURLState() {
  const _up = new URLSearchParams(window.location.search);

  function getParam(k: string, fb: string): string {
    return _up.has(k) ? _up.get(k)! : fb;
  }

  const hasParams = _up.toString() !== "";

  function writeParams(params: Record<string, string>): void {
    const p = new URLSearchParams(params);
    window.history.replaceState({}, "", "?" + p.toString());
  }

  return { getParam, hasParams, writeParams };
}
