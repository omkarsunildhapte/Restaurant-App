import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '@app/core/api.config';

/** A failed request: a message a person can act on, plus the HTTP status (0 = API unreachable). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** The envelope every endpoint returns. */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Unwraps the API envelope and turns failures into a message a person can act on.
 *
 * The most likely failure in development is not a bad request — it is the API not running
 * at all, which arrives as status 0 with no body. Saying "Http failure response for
 * http://localhost:4000..." helps nobody; naming the actual situation does.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  public get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.http
      .get<ApiEnvelope<T>>(API_BASE_URL + path, { params })
      .pipe(map((res) => res.data), catchError(ApiClient.toMessage));
  }

  public post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiEnvelope<T>>(API_BASE_URL + path, body)
      .pipe(map((res) => res.data), catchError(ApiClient.toMessage));
  }

  public patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiEnvelope<T>>(API_BASE_URL + path, body)
      .pipe(map((res) => res.data), catchError(ApiClient.toMessage));
  }

  public delete(path: string): Observable<void> {
    return this.http
      .delete<void>(API_BASE_URL + path)
      .pipe(map(() => undefined), catchError(ApiClient.toMessage));
  }

  private static toMessage(error: HttpErrorResponse): Observable<never> {
    if (error.status === 0) {
      return throwError(() => new ApiError('Cannot reach the API at ' + API_BASE_URL + '. Is it running?', 0));
    }
    if (error.status === 401) {
      return throwError(() => new ApiError('Not signed in. The API rejected the request.', 401));
    }
    const message =
      (error.error as { message?: string } | null)?.message ??
      'Request failed with status ' + error.status;
    return throwError(() => new ApiError(message, error.status));
  }
}
