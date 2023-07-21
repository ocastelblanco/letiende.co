import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Menu {
  id: number;
  padre: number;
  posicion: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  valor: number;
  tipo: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private menuJson: string = 'https://script.google.com/macros/s/AKfycbzAgKjUUqb_xqVjIU6ci_egsJhPPc3bpn5V7mKJWKW6yEt-PrvmDcRlm7f429cw0F4/exec';
  private menu: BehaviorSubject<Menu[]> = new BehaviorSubject<Menu[]>([]);
  constructor(private http: HttpClient) { }
  init(): void {
    this.http.get(this.menuJson, { responseType: 'json' })
      .subscribe((resp: any) => {
        const menu: Menu[] = [];
        resp.forEach((el: any) => {
          menu.push({
            id: el[0],
            padre: el[1],
            posicion: el[2],
            titulo: el[3],
            descripcion: el[4],
            imagen: el[5],
            valor: el[6],
            tipo: el[7]
          });
        });
        this.menu.next(menu);
      });
  }
  getMenu(): BehaviorSubject<Menu[]> {
    return this.menu;
  }
}
