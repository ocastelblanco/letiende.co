import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./compartidos/componentes/navbar/navbar";

@Component({
  selector: 'lt-root',
  imports: [
    RouterOutlet,
    Navbar
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App { }
