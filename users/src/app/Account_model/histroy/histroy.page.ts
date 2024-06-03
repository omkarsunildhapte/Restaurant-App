import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-histroy',
  templateUrl: './histroy.page.html',
  styleUrls: ['./histroy.page.scss'],
})
export class HistroyPage implements OnInit {
  segment: string='order';
  isLoader:boolean=false;
  constructor() { }

  ngOnInit() {
  }

}
