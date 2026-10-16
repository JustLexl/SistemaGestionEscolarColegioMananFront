import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { Profesor } from '../../models/profesor.model';

@Component({
  selector: 'app-profesor-detail-modal',
  templateUrl: './profesor-detail-modal.html',
  styleUrl: './profesor-detail-modal.scss',
})
export class ProfesorDetailModal implements AfterViewInit {
  @ViewChild('closeButton', { static: true })
  private readonly closeButton!: ElementRef<HTMLButtonElement>;

  readonly profesor = input.required<Profesor>();
  readonly closed = output<void>();

  ngAfterViewInit(): void {
    this.closeButton.nativeElement.focus();
  }

  protected cerrar(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  protected cerrarConEscape(): void {
    this.cerrar();
  }
}
