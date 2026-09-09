import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Escola {
  id: number;
  nome: string;
  criado_em: string;
  atualizado_em: string;
  ativo: boolean;
}
