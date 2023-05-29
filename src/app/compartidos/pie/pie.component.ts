import { Component } from '@angular/core';
import { IconDefinition, faInstagram } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'lt-pie',
  templateUrl: './pie.component.html',
  styleUrls: ['./pie.component.scss']
})
export class PieComponent {
  ig: IconDefinition = faInstagram;
}
