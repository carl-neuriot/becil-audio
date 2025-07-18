export function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const paddedHrs = String(hrs).padStart(2, '0');
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
}

export function getLastSegment(url: string) {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}

function mulberry32(seed: number) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash >>> 0; // Ensure it's positive
}

// Generate deterministic amplitudes
export function generateAmplitudes(seedInput: string, duration: number): number[] {
  const pointsPerSecond = 100; // Higher density for better zoom resolution
  const count = Math.floor(duration * pointsPerSecond);
  const seed = stringToSeed(seedInput);
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => rand() * 0.9 + 0.1);
}


export function formatSecondsToHHMMSS(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => String(n).padStart(2, '0');

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}


export function getRandomHex(color: string): string {
  var hue: number, lightnessRange: number;
  if(color === "orange"){
    hue = 30;
    lightnessRange = 40;
  } else if(color === "green"){
    hue = 135;
    lightnessRange = 20;
  }
  
  // Random saturation between 80% to 100% for vibrant color
  const saturation = Math.floor(80 + Math.random() * 20);
  
  // Random lightness from 40% (dark orange) to 80% (light orange)
  const lightness = Math.floor(50 + Math.random() * lightnessRange);

  // Convert HSL to hex
  return hslToHex(hue, saturation, lightness);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

  return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}


export function deterministicRandomFromList(numbers) {
  // Convert the list to a string
  const str = numbers.join(',');

  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }

  // Make sure it's non-negative
  hash = Math.abs(hash);

  // Convert to a pseudo-random float between 0 and 1
  return (hash % 1000000) / 1000000;
}
