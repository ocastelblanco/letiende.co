import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Vinculo } from '../navbar.component';

@Component({
  selector: 'lt-menu-desplegable',
  templateUrl: './menu-desplegable.component.html',
  styleUrls: ['./menu-desplegable.component.scss']
})
export class MenuDesplegableComponent {
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { vinculos: Vinculo[], idioma: string }) { }
}
