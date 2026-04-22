export type MediaProjectType = 'photo' | 'video';

export interface PhotoAdjustments {
  // Light
  exposure: number;     // -100..100
  brightness: number;   // -100..100
  contrast: number;     // -100..100
  highlights: number;   // -100..100
  shadows: number;      // -100..100
  whites: number;       // -100..100
  blacks: number;       // -100..100
  clarity: number;      // -100..100
  // Color
  saturation: number;   // -100..100
  vibrance: number;     // -100..100
  temperature: number;  // -100..100 (warm/cool)
  // Effects
  vignette: number;     // 0..100
  preset?: string;
}

export const DEFAULT_ADJUSTMENTS: PhotoAdjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  clarity: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  vignette: 0,
};

export interface VideoClip {
  id: string;
  start: number; // segundos no source original
  end: number;
}

export interface VideoCaption {
  id: string;
  start: number;
  end: number;
  text: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    background?: string;
    y?: number; // 0-1, posição vertical
  };
}

export interface VideoProjectData {
  duration?: number;
  clips: VideoClip[];
  captions: VideoCaption[];
  audio?: { denoise?: boolean };
}

export interface PhotoProjectData {
  adjustments: PhotoAdjustments;
}

export type MediaProjectData = PhotoProjectData | VideoProjectData | Record<string, never>;

export interface MediaProject {
  id: string;
  user_id: string;
  task_id: string | null;
  type: MediaProjectType;
  title: string;
  thumbnail_url: string | null;
  source_url: string | null;
  output_url: string | null;
  project_data: MediaProjectData;
  created_at: string;
  updated_at: string;
}
