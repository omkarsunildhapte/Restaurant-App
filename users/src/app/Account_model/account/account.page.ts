import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/service/auth.service';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';
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
    { header: 'Payment Methods', subHeader: 'Add your Credit & Debit Cards',icon:"card",route: '/main/account' },
    { header: 'Delivery Locations', subHeader: 'Change your Delivery Locations',icon:"location",route: '/location' },
    { header: 'History', subHeader: 'History Of Account',icon:"hourglass-outline",route: '/main/histroy' }
  ];
  moreList:NavItem[] = [
    { header: 'Rate Us', subHeader: 'You will receive daily updates',icon:"star",route:'' },
    { header: 'FAQ', subHeader: 'Frequently Asked Questions' ,icon:"book",route:''},
  ];
  displayName:string ='';
  isLoader:boolean=true;
  constructor(
    public routerLink : RoutingService,
    private userService:UserService,
    public authService:AuthService
  ){

  }
  ngOnInit(): void {
    const uid = localStorage.getItem('uid')
    if (uid){
      this.userService.getuserById(uid).subscribe((res:any)=>{
        this.isLoader =false;
        this.displayName = res.displayName
      })
    }
  }
  getValue(value:any){
    this.routerLink.navigateUrl(value,undefined)
  }
  open(value:any){
    if(value.header =='Rate Us'){
      window.open('https://www.youtube.com/', '_blank');
    }
  }
}
