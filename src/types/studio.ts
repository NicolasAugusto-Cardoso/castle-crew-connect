export type MediaProjectType = 'photo' | 'video';

export interface PhotoAdjustments {
  brightness: number;   // 0-200, default 100
  contrast: number;     // 0-200, default 100
  saturate: number;     // 0-200, default 100
  exposure: number;     // -100 a 100, default 0
  temperature: number;  // -100 a 100, default 0 (warm/cool)
  vignette: number;     // 0-100, default 0
  preset?: string;
}

export const DEFAULT_ADJUSTMENTS: PhotoAdjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  exposure: 0,
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
