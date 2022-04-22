function unescape(value: string): string {
  const str = value.toString();
  let result = "";
  let index = 0;
  let chr, part;
  while (index < str.length) {
    chr = str.charAt((index += 1));
    if (chr === "%") {
      if (str.charAt(index) === "u") {
        part = str.slice(index + 1, index + 5);
        if (/^[\da-f]{4}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 5;
          continue;
        }
      } else {
        part = str.slice(index, index + 2);
        if (/^[\da-f]{2}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 2;
          continue;
        }
      }
    }
    result += chr;
  }
  return result;
}

export function encode(value: any): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
}

export function decode(value: string): any {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(value))));
  } catch (err) {
    return {};
  }
}
