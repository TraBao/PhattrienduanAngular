import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../../material-module';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterLink],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.scss']
})
export class LandingPageComponent {

}