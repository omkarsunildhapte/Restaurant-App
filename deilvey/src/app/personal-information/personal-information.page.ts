import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../service/routing.service';

@Component({
  selector: 'app-personal-information',
  templateUrl: './personal-information.page.html',
  styleUrls: ['./personal-information.page.scss'],
})
export class PersonalInformationPage implements OnInit {

  constructor(
    public routing: RoutingService
  ) { }
  ngOnInit() {
  }

}
