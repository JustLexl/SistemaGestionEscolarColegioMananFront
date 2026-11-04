import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiError, AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected mostrarPassword = false;
  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected async iniciarSesion(): Promise<void> {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email.trim(), password);
      this.form.controls.password.reset();
      await this.router.navigate(['/grados-y-grupos']);
    } catch (error) {
      this.error.set(
        error instanceof AuthApiError
          ? error.message
          : 'No fue posible iniciar sesión.',
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
