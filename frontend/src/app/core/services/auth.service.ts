import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private api = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  login(email: string, senha: string, perfil: string) {
    return this.http.post(`${this.api}/login`, {
        email,
        senha,
        perfil
    });
    }
}