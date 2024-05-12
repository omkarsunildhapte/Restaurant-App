import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-feedback-model',
  templateUrl: './feedback-model.component.html',
  styleUrls: ['./feedback-model.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class FeedbackModelComponent  implements OnInit {
  
  @Input() message:any='';
  constructor() { }

  ngOnInit() {}

}
