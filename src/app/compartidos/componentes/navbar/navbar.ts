import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FirebaseStorageImage } from '@directivas/firebase-storage-image';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { LtConfig, NavbarItem } from '@servicios/lt-config';

@Component({
  selector: 'lt-navbar',
  imports: [
    PrimengModule,
    NgClass,
    RouterModule,
    FirebaseStorageImage,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private config: LtConfig = inject(LtConfig);
  menuItems: NavbarItem[] = this.config.navbarItems;
}
