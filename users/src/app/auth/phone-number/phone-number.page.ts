import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-phone-number',
  templateUrl: './phone-number.page.html',
  styleUrls: ['./phone-number.page.scss'],
})
export class PhoneNumberPage implements OnInit {
  phoneNumberForm!: FormGroup;
  isLoading:boolean = false;
  isSubmit:boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    public routerLink:RoutingService,
  ) { }

  ngOnInit() {
    this.phoneNumberForm = this.formBuilder.group({
      phoneNumber: ['', Validators.required],
    })
  }
  onSubmit() {
    if(this.phoneNumberForm.valid){
      const uid = localStorage.getItem('uid');
      if (uid){
        this.userService.updatePhoneNumber(
          uid,
          this.phoneNumberForm.value.phoneNumber
        ).subscribe((res:any)=>{
          this.routerLink.navigateUrl('/location',undefined)
        })
      }

    } else{
      this.phoneNumberForm.markAllAsTouched();
    }
  }

}
