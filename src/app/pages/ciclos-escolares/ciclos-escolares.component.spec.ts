import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CiclosEscolaresApiError,
  CiclosEscolaresApiService,
} from './ciclos-escolares-api.service';
import { CiclosEscolaresComponent } from './ciclos-escolares.component';

describe('CiclosEscolaresComponent', () => {
  let component: CiclosEscolaresComponent;
  let fixture: ComponentFixture<CiclosEscolaresComponent>;
  let api: Record<string, ReturnType<typeof vi.fn>>;

  const finalizado = { id: 1, nombre: '2024–2025', fechaInicio: '2024-08-26', fechaFin: '2025-07-11', estado: 'Finalizado' } as const;
  const activo = { id: 2, nombre: '2026–2027', fechaInicio: '2026-08-31', fechaFin: '2027-07-09', estado: 'Activo' } as const;
  const planeado = { id: 3, nombre: '2027–2028', fechaInicio: '2027-08-30', fechaFin: '2028-07-14', estado: 'Planeacion' } as const;

  beforeEach(async () => {
    api = {
      obtenerCiclos: vi.fn().mockResolvedValue([finalizado, activo, planeado]),
      crearCiclo: vi.fn().mockResolvedValue(planeado),
      actualizarCiclo: vi.fn().mockResolvedValue(planeado),
    };
    await TestBed.configureTestingModule({
      imports: [CiclosEscolaresComponent],
      providers: [{ provide: CiclosEscolaresApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(CiclosEscolaresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await (component as any).cargarCiclos();
    fixture.detectChanges();
    vi.clearAllMocks();
  });

  const ui = () => component as any;

  it('renderiza los tres ciclos y sus estados legibles', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('2024–2025');
    expect(texto).toContain('2026–2027');
    expect(texto).toContain('Planeación');
  });

  it('calcula KPIs a partir de la respuesta real', () => {
    expect(ui().activos()).toBe(1);
    expect(ui().planeados()).toBe(1);
  });

  it('crea un ciclo y recarga el padrón', async () => {
    ui().abrirCrear();
    ui().form.setValue({ nombre: '2028–2029', fechaInicio: '2028-08-28', fechaFin: '2029-07-13' });
    await ui().guardar();
    expect(api['crearCiclo']).toHaveBeenCalledWith(expect.objectContaining({ nombre: '2028–2029' }));
    expect(api['obtenerCiclos']).toHaveBeenCalledOnce();
  });

  it('edita únicamente un ciclo en planeación', async () => {
    ui().abrirEditar(planeado);
    ui().form.controls.nombre.setValue('2027–2028 Ajustado');
    await ui().guardar();
    expect(api['actualizarCiclo']).toHaveBeenCalledWith(3, expect.objectContaining({ nombre: '2027–2028 Ajustado' }));
  });

  it('no abre edición para el ciclo activo', () => {
    ui().abrirEditar(activo);
    expect(ui().modalAbierto()).toBe(false);
  });

  it('valida en cliente que inicio sea anterior a fin', async () => {
    ui().abrirCrear();
    ui().form.setValue({ nombre: 'Inválido', fechaInicio: '2029-07-13', fechaFin: '2028-08-28' });
    await ui().guardar();
    expect(api['crearCiclo']).not.toHaveBeenCalled();
    expect(ui().error()).toContain('anterior');
  });

  it('filtra por estado', () => {
    ui().filtroEstado.set('Finalizado');
    expect(ui().ciclosFiltrados()).toEqual([finalizado]);
  });

  it('muestra validaciones de solapamiento del backend', async () => {
    api['crearCiclo'].mockRejectedValueOnce(new CiclosEscolaresApiError(409, 'Las fechas se solapan con otro ciclo.'));
    ui().abrirCrear();
    ui().form.setValue({ nombre: 'Solapado', fechaInicio: '2027-09-01', fechaFin: '2028-08-31' });
    await ui().guardar();
    expect(ui().error()).toContain('solapan');
  });
});
