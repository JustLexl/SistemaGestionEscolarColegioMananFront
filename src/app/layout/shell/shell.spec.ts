import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Shell } from './shell';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { usuario: signal(null), logout: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
  });

  it('muestra Importar datos en la navegación lateral', () => {
    const enlace = [...fixture.nativeElement.querySelectorAll('a')]
      .find((item: HTMLAnchorElement) => item.getAttribute('href') === '/importacion');
    expect(enlace?.textContent).toContain('Importar datos');
  });
});
