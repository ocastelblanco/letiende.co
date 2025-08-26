import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ButtonModule,
    MenubarModule,
    MenuModule,
    CardModule,
  ],
  exports: [
    ButtonModule,
    MenubarModule,
    MenuModule,
    CardModule,
  ]
})
export class PrimengModule { }