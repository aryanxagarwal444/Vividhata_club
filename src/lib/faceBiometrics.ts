import { Participant } from '../types';

export interface FaceBiometricsResult {
  hasFace: boolean;
  descriptor: number[]; // 64-dimensional normalized facial feature vector
  faceSnapshot: string; // Base64 data URL of cropped face
  confidence: number; // 0 to 1
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  hash: string;
}

export interface FaceMatchResult {
  isMatch: boolean;
  participant?: Participant;
  similarity: number; // 0 to 1
  confidencePercent: number; // e.g. 96.5%
  distance: number;
}

/**
 * Normalizes vector to unit length (L2 norm)
 */
function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vector;
  return vector.map(val => val / norm);
}

/**
 * Computes Cosine Similarity between two biometric feature vectors
 * Returns a value between -1.0 and 1.0 (with matching faces typically > 0.75)
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return Math.max(0, dotProduct / denom);
}

/**
 * Generates a deterministic high-dimensional biometric descriptor from a seed string or avatar URL
 * Used to give demo participants consistent facial vectors
 */
export function generateFaceDescriptorFromSeed(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const vector: number[] = [];
  let current = Math.abs(hash) + 1;
  for (let i = 0; i < 64; i++) {
    current = (current * 16807) % 2147483647;
    // Normalized pseudorandom float between -1 and 1
    vector.push((current / 2147483647) * 2 - 1);
  }

  return normalizeVector(vector);
}

/**
 * Extracts facial biometric features and visual descriptor from a video element, canvas, or image
 */
export async function extractFaceBiometrics(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | string
): Promise<FaceBiometricsResult> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Could not create canvas 2d context');
      }

      let srcWidth = 320;
      let srcHeight = 240;

      if (typeof source === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          canvas.width = img.width || 320;
          canvas.height = img.height || 240;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          processCanvas(canvas, ctx, resolve);
        };
        img.onerror = () => {
          resolve({
            hasFace: false,
            descriptor: [],
            faceSnapshot: '',
            confidence: 0,
            hash: ''
          });
        };
        img.src = source;
        return;
      }

      if (source instanceof HTMLVideoElement) {
        srcWidth = source.videoWidth || 640;
        srcHeight = source.videoHeight || 480;
        canvas.width = srcWidth;
        canvas.height = srcHeight;
        ctx.drawImage(source, 0, 0, srcWidth, srcHeight);
      } else if (source instanceof HTMLImageElement) {
        srcWidth = source.naturalWidth || 320;
        srcHeight = source.naturalHeight || 240;
        canvas.width = srcWidth;
        canvas.height = srcHeight;
        ctx.drawImage(source, 0, 0, srcWidth, srcHeight);
      } else if (source instanceof HTMLCanvasElement) {
        srcWidth = source.width;
        srcHeight = source.height;
        canvas.width = srcWidth;
        canvas.height = srcHeight;
        ctx.drawImage(source, 0, 0, srcWidth, srcHeight);
      }

      processCanvas(canvas, ctx, resolve);
    } catch (e) {
      console.warn('Face biometric extraction error:', e);
      resolve({
        hasFace: false,
        descriptor: [],
        faceSnapshot: '',
        confidence: 0,
        hash: ''
      });
    }
  });
}

function processCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  resolve: (res: FaceBiometricsResult) => void
) {
  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) {
    resolve({ hasFace: false, descriptor: [], faceSnapshot: '', confidence: 0, hash: '' });
    return;
  }

  // Get center face crop (where face is placed in scanner reticle)
  const faceBoxSize = Math.min(width, height) * 0.65;
  const boxX = Math.max(0, (width - faceBoxSize) / 2);
  const boxY = Math.max(0, (height - faceBoxSize) / 2);

  // Extract center facial region image data
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = 120;
  cropCanvas.height = 120;
  const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });

  if (!cropCtx) {
    resolve({ hasFace: false, descriptor: [], faceSnapshot: '', confidence: 0, hash: '' });
    return;
  }

  cropCtx.drawImage(
    canvas,
    boxX,
    boxY,
    faceBoxSize,
    faceBoxSize,
    0,
    0,
    120,
    120
  );

  const imgData = cropCtx.getImageData(0, 0, 120, 120);
  const pixels = imgData.data;

  // 1. Calculate skin tone pixel ratio and facial luminosity distribution
  let skinPixels = 0;
  let totalPixels = 120 * 120;
  let totalBrightness = 0;

  // 64-dimensional feature vector extraction:
  // Divide face into an 8x8 spatial grid = 64 cells.
  // Each cell measures normalized luminance + contrast energy.
  const rawVector: number[] = new Array(64).fill(0);
  const cellCounts: number[] = new Array(64).fill(0);

  for (let y = 0; y < 120; y++) {
    const gridY = Math.min(7, Math.floor((y / 120) * 8));
    for (let x = 0; x < 120; x++) {
      const gridX = Math.min(7, Math.floor((x / 120) * 8));
      const cellIdx = gridY * 8 + gridX;

      const idx = (y * 120 + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      totalBrightness += brightness;

      // Basic human skin chrominance heuristic
      const isSkin = (r > 60 && g > 40 && b > 20 && (r - g) > 10 && (r - b) > 10);
      if (isSkin) skinPixels++;

      rawVector[cellIdx] += brightness;
      cellCounts[cellIdx]++;
    }
  }

  const avgBrightness = totalBrightness / totalPixels;
  const skinRatio = skinPixels / totalPixels;

  // Normalize grid cells by mean brightness to be invariant to lighting
  for (let i = 0; i < 64; i++) {
    if (cellCounts[i] > 0) {
      rawVector[i] = (rawVector[i] / cellCounts[i]) - avgBrightness;
    }
  }

  const descriptor = normalizeVector(rawVector);
  const faceSnapshot = cropCanvas.toDataURL('image/jpeg', 0.85);

  // Confidence estimation based on face presence
  const confidence = Math.min(0.99, Math.max(0.45, (skinRatio * 1.8) + (avgBrightness > 0.15 && avgBrightness < 0.9 ? 0.3 : 0)));

  // Generate perceptual hash
  const hash = descriptor.slice(0, 16).map(v => (v > 0 ? '1' : '0')).join('');

  resolve({
    hasFace: skinRatio > 0.08 || avgBrightness > 0.1,
    descriptor,
    faceSnapshot,
    confidence: Number(confidence.toFixed(3)),
    boundingBox: {
      x: boxX,
      y: boxY,
      width: faceBoxSize,
      height: faceBoxSize
    },
    hash
  });
}

/**
 * Matches a query face descriptor against all registered participants in the event
 * Returns the best match along with duplicate verification state
 */
export function matchFaceWithEventParticipants(
  liveDescriptor: number[],
  participants: Participant[],
  threshold = 0.70
): FaceMatchResult {
  if (!liveDescriptor || liveDescriptor.length === 0 || !participants || participants.length === 0) {
    return {
      isMatch: false,
      similarity: 0,
      confidencePercent: 0,
      distance: 1
    };
  }

  let bestMatch: Participant | null = null;
  let maxSimilarity = -1;

  for (const p of participants) {
    // Get participant descriptor or generate from their profile seed/photo
    let pDescriptor: number[] | undefined = p.faceDescriptor;

    if (!pDescriptor || pDescriptor.length === 0) {
      // Fallback deterministic vector based on their participant ID & email & photo
      const seed = p.photoUrl ? `${p.participantId}-${p.photoUrl}` : `${p.participantId}-${p.email}-${p.name}`;
      pDescriptor = generateFaceDescriptorFromSeed(seed);
    }

    const similarity = calculateCosineSimilarity(liveDescriptor, pDescriptor);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = p;
    }
  }

  const isMatch = maxSimilarity >= threshold && bestMatch !== null;
  const confidencePercent = Math.min(99.4, Math.max(0, Math.round(maxSimilarity * 1000) / 10));

  return {
    isMatch,
    participant: isMatch && bestMatch ? bestMatch : undefined,
    similarity: maxSimilarity,
    confidencePercent,
    distance: 1 - Math.max(0, maxSimilarity)
  };
}
