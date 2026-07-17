/**
 * API Client with Type Safety and Error Handling
 */

import { APIError, VideoProcessRequest, VideoProcessResponse } from '@/types';
import { withRetry, asyncWrapper } from './errors';

/**
 * Generic API Request Handler
 */
export class APIClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make HTTP request with proper error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await this.parseErrorResponse(response);
      throw error;
    }

    const data = await response.json() as T;
    return data;
  }

  /**
   * Parse error response
   */
  private async parseErrorResponse(response: Response): Promise<APIError> {
    let message = `HTTP ${response.status}`;
    try {
      const error = await response.json() as { message?: string };
      message = error.message || message;
    } catch {
      // Use default message if JSON parse fails
    }
    throw new APIError(response.status, `HTTP_${response.status}`, message);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return withRetry(() =>
      this.request<T>(endpoint, { method: 'GET' }),
    );
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return withRetry(() =>
      this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),
    );
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return withRetry(() =>
      this.request<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),
    );
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return withRetry(() =>
      this.request<T>(endpoint, { method: 'DELETE' }),
    );
  }
}

/**
 * Video Processor API Client
 */
export class VideoProcessorAPI extends APIClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async processVideo(
    request: VideoProcessRequest,
  ): Promise<VideoProcessResponse> {
    return this.post<VideoProcessResponse>(
      '/api/process-video',
      request,
    );
  }

  async getProcessingStatus(videoId: string): Promise<VideoProcessResponse> {
    return this.get<VideoProcessResponse>(`/api/processing-status/${videoId}`);
  }

  async cancelProcessing(videoId: string): Promise<void> {
    await this.post(`/api/cancel-processing/${videoId}`);
  }
}

/**
 * Initialize API Clients
 */
export const createAPIClients = () => {
  const videoProcessorUrl =
    import.meta.env.VITE_VIDEO_PROCESSOR_BASE_URL ||
    'https://api.spillit.app';

  return {
    api: new APIClient(),
    videoProcessor: new VideoProcessorAPI(videoProcessorUrl),
  };
};
