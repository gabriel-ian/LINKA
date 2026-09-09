import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Escola } from "../model/escola.model";

@Injectable({
  providedIn: 'root'
})
export class EscolaService {

  private apiUrl = 'http://localhost:3000/escolas';

  constructor(private http: HttpClient) {}

  listar(): Observable<Escola[]> {
    return this.http.get<Escola[]>(this.apiUrl);
  }

  cadastrar(nome: string): Observable<Escola> {
    return this.http.post<Escola>(this.apiUrl, {
      nome: nome,
    });
  }

  atualizar(id: number, nome: string): Observable<Escola> {
    return this.http.patch<Escola>(`${this.apiUrl}/${id}`, {
      nome: nome,
    });
  }

  desativar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  ativar(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/ativar`, {});
  }
}
