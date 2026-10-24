import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { routes } from './app.routes';
import { NavegacaoService } from './core/services/navegacao.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Baixa todas as telas logo no inicio: se a internet cair, o aluno ainda
    // navega entre elas (modo sem conexao).
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Comeca a contar as telas ja na primeira, para o "Voltar" saber se ha anterior.
    provideAppInitializer(() => void inject(NavegacaoService)),
    // Guarda o app e as imagens no navegador: a Linka abre e mostra as
    // missoes mesmo sem internet. So no build de producao (nao no ng serve).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately',
    }),
  ],
};
