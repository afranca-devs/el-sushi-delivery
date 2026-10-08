import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { environment } from '../environments/environment';

// 1. IMPORTS NECESSÁRIOS PARA O PORTUGUÊS
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

// 2. REGISTRAR A LINGUAGEM
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),

    // 3. CONFIGURAÇÃO GLOBAL DO BRASIL (Muda ponto para vírgula em todo o app)
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
};