import { Component, OnInit } from '@angular/core';
export interface NavItem {
  header: string;
  subHeader: string;
  icon: string;
  route: string;
}
@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
})
export class AccountPage implements OnInit {
  generalList:NavItem[] = [
    { header: 'Account information', subHeader: 'Change your Account information',icon:"person",route: '/main/account-information' },
    { header: 'Password', subHeader: 'Change your Password',icon:"lock-closed",route: '/main/change-password' },
  ];
  moreList:NavItem[] = [
    { header: 'Rate Us', subHeader: 'You will receive daily updates',icon:"star",route:'' },
    { header: 'FAQ', subHeader: 'Frequently Asked Questions' ,icon:"book",route:''},
  ];
  displayName:string ='A';
  isLoader:boolean=true;
  constructor() { }

  ngOnInit() {
  }

}
