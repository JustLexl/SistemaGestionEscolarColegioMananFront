import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AlumnosComponent } from './alumnos.component';

describe('AlumnosComponent con relaciones académicas reales', () => {
  let component: AlumnosComponent;
  let fixture: ComponentFixture<AlumnosComponent>;
  let http: HttpTestingController;

  const cicloHistorico = {
    id: 1, nombre: '2024–2025', estado: 'Finalizado',
  } as const;
  const cicloActivo = {
    id: 2, nombre: '2026–2027', estado: 'Activo',
  } as const;
  const gradoHistorico = {
    id: '4', nombre: '4° Primaria', nivel: 'Primaria',
    numeroGrado: 4, cicloEscolarId: 1,
  };
  const gradoSecundaria = {
    id: '7', nombre: '1° Secundaria', nivel: 'Secundaria',
    numeroGrado: 1, cicloEscolarId: 2,
  };
  const gradoSecundariaDos = {
    id: '8', nombre: '2° Secundaria', nivel: 'Secundaria',
    numeroGrado: 2, cicloEscolarId: 2,
  };
  const grupoHistorico = {
    id: 1, gradoId: '4', nombre: '4° Primaria - Grupo A',
    grupoLetra: 'A', clave: 'CM-PRI-4A-24', turno: 'matutino',
    estado: 'Activo', grado: gradoHistorico, cicloEscolarId: 1,
    cicloEscolar: cicloHistorico,
  };
  const grupoActivo = {
    id: 10, gradoId: '7', nombre: '1° Secundaria - Grupo A',
    grupoLetra: 'A', clave: 'CM-SEC-1A-26', turno: 'matutino',
    estado: 'Activo', grado: gradoSecundaria, cicloEscolarId: 2,
    cicloEscolar: cicloActivo,
  };
  const grupoActivoOtroGrado = {
    id: 11, gradoId: '8', nombre: '2° Secundaria - Grupo B',
    grupoLetra: 'B', clave: 'CM-SEC-2B-26', turno: 'vespertino',
    estado: 'Activo', grado: gradoSecundariaDos, cicloEscolarId: 2,
    cicloEscolar: cicloActivo,
  };
  const sofia = {
    id: 1,
    matricula: 'CM-2026-001',
    nombre: 'Sofía Hernández López',
    fechaNacimiento: '',
    grupoId: 1,
    grupo: grupoHistorico,
    grado: gradoHistorico,
    cicloEscolar: cicloHistorico,
    tutor: 'María López',
    estado: 'Activo',
  } as const;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlumnosComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlumnosComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function responderCarga(
    grupos = [grupoHistorico, grupoActivo, grupoActivoOtroGrado],
    alumnos = [sofia],
  ): void {
    http.expectOne('http://localhost:3000/api/alumnos').flush({
      success: true, data: alumnos,
    });
    http.expectOne('http://localhost:3000/api/grupos').flush({
      success: true, data: grupos,
    });
    http.expectOne('http://localhost:3000/api/ciclos-escolares').flush({
      success: true, data: [cicloHistorico, cicloActivo],
    });
    fixture.detectChanges();
  }

  it('carga alumnos, grupos reales y ciclos desde sus APIs', () => {
    responderCarga();
    expect(component.alumnos).toHaveLength(1);
    expect(component.grupos.map(grupo => grupo.id)).toEqual([1, 10, 11]);
    expect(component.ciclos).toHaveLength(2);
  });

  it('no presenta grados hardcodeados que no existen en los datos', () => {
    responderCarga();
    component.abrirRegistro();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('6° Primaria');
  });

  it('muestra el ciclo activo obtenido de la API', () => {
    responderCarga();
    expect(component.cicloActivo?.nombre).toBe('2026–2027');
    expect(fixture.nativeElement.textContent).toContain('Ciclo activo: 2026–2027');
  });

  it('deriva el selector de grados de los grupos activos', () => {
    responderCarga();
    expect(component.gradosFormulario.map(grado => grado.nombre)).toEqual([
      '1° Secundaria', '2° Secundaria',
    ]);
  });

  it('limita el selector de grupo al grado seleccionado', () => {
    responderCarga();
    component.abrirRegistro();
    component.gradoSeleccionadoId = '7';
    component.cambiarGradoFormulario();
    expect(component.gruposFormulario.map(grupo => grupo.id)).toEqual([10]);
  });

  it('envía grupoId al registrar un alumno', () => {
    responderCarga();
    component.nuevoAlumno = {
      id: 0,
      matricula: 'CM-2026-006',
      nombre: 'Alumno Demo',
      fechaNacimiento: '2015-06-10',
      grupoId: 10,
      tutor: 'Tutor Demo',
      estado: 'Activo',
    };
    component.guardarAlumno();

    const alta = http.expectOne('http://localhost:3000/api/alumnos');
    expect(alta.request.method).toBe('POST');
    expect(alta.request.body.grupoId).toBe(10);
    alta.flush({ success: true, data: { ...sofia, id: 6, grupoId: 10 } });
    http.expectOne('http://localhost:3000/api/alumnos').flush({
      success: true, data: [sofia],
    });
  });

  it('no envía grado ni grupo como strings académicos', () => {
    responderCarga();
    component.nuevoAlumno = {
      id: 0, matricula: 'CM-2026-006', nombre: 'Alumno Demo',
      fechaNacimiento: '2015-06-10', grupoId: 10,
      tutor: 'Tutor Demo', estado: 'Activo',
    };
    component.guardarAlumno();
    const alta = http.expectOne('http://localhost:3000/api/alumnos');
    expect(alta.request.body).not.toHaveProperty('grado');
    expect(alta.request.body).not.toHaveProperty('grupo');
    alta.flush({ success: true, data: sofia });
    http.expectOne('http://localhost:3000/api/alumnos').flush({
      success: true, data: [sofia],
    });
  });

  it('precarga grupoId y grado al editar un alumno', () => {
    responderCarga();
    component.editarAlumno(sofia as never);
    expect(component.nuevoAlumno.grupoId).toBe(1);
    expect(component.gradoSeleccionadoId).toBe('4');
  });

  it('bloquea la asignación académica de un alumno histórico', async () => {
    responderCarga();
    component.editarAlumno(sofia as never);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.asignacionAcademicaBloqueada).toBe(true);
    expect(component.mensajeHistorial).toContain(
      'La asignación académica se conserva como historial.',
    );
  });

  it('construye filtros de ciclo, grado y grupo con relaciones reales', () => {
    responderCarga();
    component.filtroCiclo = '1';
    expect(component.gradosFiltro.map(grado => grado.id)).toEqual(['4']);
    component.filtroGrado = '4';
    expect(component.gruposFiltro.map(grupo => grupo.id)).toEqual([1]);
  });

  it('incluye Secundaria cuando hay grupos disponibles', () => {
    responderCarga();
    expect(component.gradosFormulario.some(
      grado => grado.nivel === 'Secundaria',
    )).toBe(true);
  });

  it('muestra un mensaje y deshabilita el alta si no hay grupos activos', async () => {
    responderCarga([grupoHistorico]);
    component.abrirRegistro();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.sinGruposDisponibles).toBe(true);
    expect(component.mensajeSinGrupos).toContain(
      'No hay grupos activos disponibles para registrar alumnos',
    );
  });
});

