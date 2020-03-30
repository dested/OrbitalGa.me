export function uuid() {
  return 'xxxxxxxx'.replace(/[x]/g, c => {
    const r = (Math.random() * 16) | 0;
    return r.toString(16);
  });
}
let id = 1;
export function nextId(): number {
  return ++id;
}
