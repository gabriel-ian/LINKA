import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DialogoHost } from './shared/dialogo/dialogo-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogoHost],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'frontend';
}
