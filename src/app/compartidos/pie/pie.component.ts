import { Component } from '@angular/core';
import { IconDefinition, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'lt-pie',
  templateUrl: './pie.component.html',
  styleUrls: ['./pie.component.scss']
})
export class PieComponent {
  ig: IconDefinition = faInstagram;
  tiktok: IconDefinition = faTiktok;
}
