import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { MypopoverPage } from '../mypopover/mypopover.page';

@Component({
  selector: 'app-food-page',
  templateUrl: './food-page.page.html',
  styleUrls: ['./food-page.page.scss'],
})
export class FoodPagePage implements OnInit {

  presentData: Date = new Date();
  constructor(
    private popoverController: PopoverController
  ) { }

  ngOnInit() {
  }

  orders = [
    {
      "data": '23-05-1995',
      "order": [
        {
          "id": "01",
          "image": "",
          "title": "Humburger",
          "amount": '55.40',
          "transId": "787879",
          "time": "20 Min",
          "status": "confirm"
        },
        {
          "id": "02",
          "image": "",
          "title": "Pizza",
          "amount": '35.40',
          "transId": "787749",
          "time": "10 Min",
          "status": "reject"
        },
        {
          "id": "03",
          "image": "",
          "title": "Pav Bhaji",
          "amount": '60',
          "transId": "787558",
          "time": "20 Min",
          "status": "confirm"
        }
      ]
    },
    {
      "data": '23-05.1995',
      "order": [
        {
          "id": "01",
          "image": "",
          "title": "Humburger",
          "amount": '55.40',
          "transId": "787879",
          "time": "20 Min",
          "status": "confirm"
        },
        {
          "id": "02",
          "image": "",
          "title": "Humburger",
          "amount": '55.40',
          "transId": "787879",
          "time": "20 Min",
          "status": "confirm"
        },
        {
          "id": "03",
          "image": "",
          "title": "Humburger",
          "amount": '55.40',
          "transId": "787879",
          "time": "20 Min",
          "status": "confirm"
        }
      ]
    },
    {
      "data": '23-05.1995',
      "order": [
        {
          "id": "01",
          "image": "",
          "title": "Humburger",
          "amount": '55.40',
          "transId": "787879",
          "time": "20 Min",
          "status": "confirm"
        },
        {
          "id": "02",
          "image": "",
          "title": "Humburger",
          "amount": '55.40',
          "transId": "787879",
          "time": "20 Min",
          "status": "confirm"
        },
        {
          "id": "03",
          "image": "",
          "title": "Humburger",
          "amount": '55.40',
          "transId": "787879",
          "time": "20 Min",
          "status": "confirm"
        }
      ]
    }
  ]

  segmentChange(ev: any) {
    console.log(ev.target.value);
  }

  async presentPopover(event: Event) {
    const popover = await this.popoverController.create({
      component: MypopoverPage,
      event: event,
      translucent: true,
    });
    return await popover.present();
  }

}
