import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  mostrarPassword = false;

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}