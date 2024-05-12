import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.scss'],
  standalone:true,
  imports:[CommonModule,IonicModule]
})
export class AlertMessageComponent  implements OnInit {
   
 @Input() message:any='';

  constructor() { }

  ngOnInit() {}

}
