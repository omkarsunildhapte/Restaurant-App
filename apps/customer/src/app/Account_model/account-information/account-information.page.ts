import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonTitle, IonToolbar } from '@ionic/angular';
import { NotConnectedToast } from 'src/app/core/data/not-implemented';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-account-information',
    templateUrl: './account-information.page.html',
    styleUrls: ['./account-information.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonTitle, IonToolbar, FormsModule, ReactiveFormsModule, LoadingComponent]
})
export class AccountInformationPage implements OnInit {
  accountForm!: FormGroup;
  readonly isLoader = signal<boolean>(true);
  constructor(
    private fb: FormBuilder,
    private userService:UserService,
    private routerLink:RoutingService,
    private notConnected: NotConnectedToast
  ) {
    
  }
  
  ngOnInit() {
    this.accountForm = this.fb.group({
      createdAt: [''],
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      uid: [''],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      updateAt: [''],
    });
    let uid = localStorage.getItem('uid');
    this.isLoader.set(false);
    if(uid){
      this.userService.getuserById(uid).subscribe((res:any)=>{
        this.isLoader.set(false);
        this.accountForm.get('displayName')?.setValue(res?.displayName ?? '');
        this.accountForm.get('email')?.setValue(res?.email ?? '');
        this.accountForm.get('phoneNumber')?.setValue(res?.phoneNumber ?? '')
      })
    }
  }

  onSubmit() {
    if (this.accountForm.valid) {
      const uid = localStorage.getItem('uid');
      if (uid){
        const rawValue = this.accountForm.getRawValue();
        rawValue.updateAt = new Date();
        this.isLoader.set(true);
        this.userService.updateAccount(uid,rawValue).subscribe((res:any)=>{
          this.isLoader.set(false);
          this.routerLink.navigateUrl('/main/account',undefined)
        }, () => {
          this.isLoader.set(false);
          this.notConnected.show();
        })
      }
    }
  }

}
