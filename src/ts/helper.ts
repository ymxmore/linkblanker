export function isArray(obj): boolean {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

export function getCurrentTime(): number {
  return new Date().getTime();
}

/**
 * バージョンを比較
 *
 * @param a バージョン
 * @param b aと比較したいバージョン
 * @returns a > b: 1, a < b: -1, a == b: 0
 */
export function compareVersion(a: string, b: string): number {
  const va = a.split('.');
  const vb = b.split('.');
  const la = va.length;
  const lb = vb.length;
  const max = Math.max(la, lb);

  for (let i = 0; i < max; i++) {
    const na = la > i ? Number(va[i]) : 0;
    const nb = lb > i ? Number(vb[i]) : 0;

    if (na > nb) {
      return 1;
    } else if (na < nb) {
      return -1;
    }
  }

  return 0;
}
