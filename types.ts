
export interface User {
  id: string;
  email: string;
}

export interface UploadedImage {
  id: string;
  data: string; // base64
  context: 'LOGO' | 'PRODUCT' | 'STYLE';
  description?: string; // User provided description (e.g. "CEO Name" or "Product X")
}

export interface Design {
  id: string;
  user_id: string;
  prompt: string;
  type: 'CV' | 'BROCHURE' | 'SLIDE' | 'PITCH' | 'SALEKIT' | 'INVITATION' | 'OTHER';
  content: string; // HTML content
  created_at: string;
  title: string;
  thumbnail?: string; // Base64 thumbnail image
  assets?: UploadedImage[]; // Persist uploaded images associated with this design
}

export enum ViewState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
}

export type DesignType = 'CV' | 'BROCHURE' | 'SLIDE' | 'PITCH' | 'SALEKIT' | 'INVITATION' | 'OTHER';
