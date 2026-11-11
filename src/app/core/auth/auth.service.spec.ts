import { TestBed } from '@angular/core/testing';
import { AuthApiError, AuthService, AuthUsuario } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let fetchMock: ReturnType<typeof vi.fn>;

  const usuario: AuthUsuario = {
    id: 1,
    nombre: 'Usuario Demo',
    correo: 'demo@colegiomanantial.edu',
    puesto: 'Administrativo',
    rol: 'Administrativo',
    estado: 'Activo',
  };

  function response(body: unknown, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as Response;
  }

  beforeEach(() => {
    sessionStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('inicia sesión y conserva únicamente token y usuario', async () => {
    fetchMock.mockResolvedValue(
      response({ success: true, token: 'token-demo', usuario }),
    );

    await expect(
      service.login(usuario.correo, 'password-temporal'),
    ).resolves.toEqual(usuario);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3002/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: usuario.correo,
          password: 'password-temporal',
        }),
      },
    );
    expect(sessionStorage.getItem('colegio_demo_auth_token')).toBe(
      'token-demo',
    );
    expect(JSON.stringify(sessionStorage)).not.toContain('password-temporal');
    expect(service.usuario()).toEqual(usuario);
  });

  it('propaga el estado y mensaje de credenciales rechazadas', async () => {
    fetchMock.mockResolvedValue(
      response({ success: false, message: 'Credenciales incorrectas.' }, 401),
    );

    await expect(service.login('nadie@example.invalid', 'incorrecta')).rejects
      .toMatchObject({
        status: 401,
        message: 'Credenciales incorrectas.',
      });
  });

  it('rechaza respuestas exitosas sin sesión completa', async () => {
    fetchMock.mockResolvedValue(
      response({ success: true, message: 'Inicio correcto.' }),
    );

    await expect(service.login(usuario.correo, 'password')).rejects.toBeInstanceOf(
      AuthApiError,
    );
  });

  it('cierra la sesión local incluso si falla el backend', async () => {
    sessionStorage.setItem('colegio_demo_auth_token', 'token-demo');
    sessionStorage.setItem(
      'colegio_demo_auth_user',
      JSON.stringify(usuario),
    );
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(service.logout()).rejects.toMatchObject({ status: 0 });
    expect(sessionStorage.getItem('colegio_demo_auth_token')).toBeNull();
    expect(sessionStorage.getItem('colegio_demo_auth_user')).toBeNull();
    expect(service.usuario()).toBeNull();
  });
});
