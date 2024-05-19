import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  users = [
    { name: 'Annette Watson', image: 'https://randomuser.me/api/portraits/women/82.jpg', score: 9.3 },
    { name: 'Calvin Steward', image: 'https://randomuser.me/api/portraits/men/81.jpg', score: 8.9 },
    { name: 'Ralph Richards', image: 'https://randomuser.me/api/portraits/men/80.jpg', score: 8.7 },
    { name: 'Bernard Murphy', image: 'https://randomuser.me/api/portraits/men/79.jpg', score: 8.2 },
    { name: 'Arlene Robertson', image: 'https://randomuser.me/api/portraits/women/78.jpg', score: 8.2 },
    { name: 'Jane Lane', image: 'https://randomuser.me/api/portraits/women/77.jpg', score: 8.1 },
    { name: 'Pat Mckinney', image: 'https://randomuser.me/api/portraits/men/76.jpg', score: 7.9 },
    { name: 'Norman Walters', image: 'https://randomuser.me/api/portraits/men/75.jpg', score: 7.7 }
  ];
}
