
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

export interface Usuario {
  id: number | string;
  nombre: string;
  correo: string;
  puesto: string;
  rol: string;
  estado: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  usuario: Usuario;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/api/auth';

  login(
    email: string,
    password: string
  ): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { email, password }
    ).pipe(timeout(15000));
  }

  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/logout`,
      {}
    ).pipe(timeout(15000));
  }

  resetPassword(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/reset-password`,
      { email }
    ).pipe(timeout(15000));
  }
}
