
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  AuthService,
  LoginResponse
} from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPage {

  email = '';
  password = '';

  mostrarPassword = false;
  cargando = false;

  mensaje = '';
  error = '';

  usuario: LoginResponse['usuario'] | null = null;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  iniciarSesion(event: Event): void {
    event.preventDefault();
    if (this.cargando) return;

    this.mensaje = '';
    this.error = '';

    if (!this.email.trim() || !this.password) {
      this.error = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login(
      this.email.trim(),
      this.password
    ).subscribe({

      next: (respuesta) => {
        this.cargando = false;

        this.usuario = respuesta.usuario;

        localStorage.setItem(
          'authToken',
          respuesta.token
        );

        localStorage.setItem(
          'usuario',
          JSON.stringify(respuesta.usuario)
        );

        this.mensaje =
          `Bienvenido ${respuesta.usuario.nombre}. Rol: ${respuesta.usuario.rol}`;

        this.cdr.markForCheck();

        // En esta rama solo existe el login. Al integrar con el sistema
        // academico, Codex conservara la ruta existente /grados-y-grupos.
        const contieneRuta = (rutas: import('@angular/router').Routes): boolean =>
          rutas.some(ruta =>
            ruta.path === 'grados-y-grupos' ||
            (ruta.children ? contieneRuta(ruta.children) : false)
          );

        if (!contieneRuta(this.router.config)) {
          this.mensaje =
            'Inicio de sesión correcto. La pantalla Grados y Grupos se abrirá en la aplicación integrada.';
          this.cdr.markForCheck();
          return;
        }

        this.router.navigateByUrl('/grados-y-grupos')
          .then(navego => {
            if (!navego) {
              this.error = 'No se pudo abrir Grados y Grupos.';
              this.cdr.markForCheck();
            }
          })
          .catch(() => {
            this.error = 'No se pudo abrir Grados y Grupos.';
            this.cdr.markForCheck();
          });
      },

      error: (error) => {
        this.cargando = false;

        this.error =
          error?.error?.message ||
          'No fue posible iniciar sesión.';

        this.cdr.markForCheck();
      }
    });
  }

  restablecerPassword(): void {
    this.mensaje = '';
    this.error = '';

    if (!this.email) {
      this.error =
        'Escribe tu correo para restablecer la contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.resetPassword(
      this.email
    ).subscribe({

      next: (respuesta) => {
        this.cargando = false;

        this.mensaje = respuesta.message;

        this.cdr.markForCheck();
      },

      error: (error) => {
        this.cargando = false;

        this.error =
          error?.error?.message ||
          'No fue posible restablecer la contraseña.';

        this.cdr.markForCheck();
      }
    });
  }

}
