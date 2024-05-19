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
    { header: 'Account information', subHeader: 'Change your Account information',icon:"person",route: 'account-information' },
    { header: 'Password', subHeader: 'Change your Password',icon:"lock-closed",route: 'account' },
    { header: 'Payment Methods', subHeader: 'Add your Credit & Debit Cards',icon:"card",route: 'account' },
    { header: 'Delivery Locations', subHeader: 'Change your Delivery Locations',icon:"location",route: 'account' }
  ];
  moreList:NavItem[] = [
    { header: 'Rate Us', subHeader: 'You will receive daily updates',icon:"star",route:'' },
    { header: 'FAQ', subHeader: 'Frequently Asked Questions' ,icon:"book",route:''},
  ];
  displayName:string =''
  ngOnInit(): void {
    const name = localStorage.getItem('displayName')
    if (name){
      this.displayName = name
    }
  }
}
