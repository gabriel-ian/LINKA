import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    localStorage.setItem('token', 'abc');
    localStorage.setItem('perfil', 'escola');
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('envia o token no cabecalho Authorization', () => {
    http.get('/api/teste').subscribe();
    const req = backend.expectOne('/api/teste');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
  });

  it('com 401 encerra a sessao e volta para o login', () => {
    http.get('/api/teste').subscribe({ error: () => undefined });
    backend.expectOne('/api/teste').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { sessao: 'encerrada' } });
  });

  it('nao trata como sessao encerrada o 401 do proprio login (senha errada)', () => {
    http.post('/auth/login', {}).subscribe({ error: () => undefined });
    backend.expectOne('/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBe('abc');
    expect(navigate).not.toHaveBeenCalled();
  });
});
