import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-mypopover',
  templateUrl: './mypopover.page.html',
  styleUrls: ['./mypopover.page.scss'],
})
export class MypopoverPage implements OnInit {

  constructor(private popoverController: PopoverController) { }

  ngOnInit() {
  }

  close() {
    this.popoverController.dismiss();
  }

}
