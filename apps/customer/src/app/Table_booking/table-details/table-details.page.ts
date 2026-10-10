import { IonButton, IonCard, IonCardContent, IonContent, IonDatetime, IonHeader, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonModal, IonSegment, IonSegmentButton, IonTextarea, IonTitle, IonToolbar } from '@ionic/angular';
import { DatePipe } from '@angular/common';
import { NotConnectedToast } from 'src/app/core/data/not-implemented';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { RoutingService } from 'src/app/service/routing.service';
import { TableService } from 'src/app/service/table.service';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-table-details',
    templateUrl: './table-details.page.html',
    styleUrls: ['./table-details.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonContent, IonDatetime, IonHeader, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonModal, IonSegment, IonSegmentButton, IonTextarea, IonTitle, IonToolbar, FormsModule, ReactiveFormsModule, LoadingComponent],
    providers: [DatePipe],
})
export class TableDetailsPage implements OnInit {
  segment: string = 'booking';
  readonly table = signal<any | undefined>(undefined);
  bookingValue: any ={};
  bookingForm: FormGroup;
  readonly isLoader = signal<boolean>(true);
  isSubmit:boolean=false;
  timeSlots: string[] = [];
  constructor(
    public routerLink: RoutingService,
    private tableService: TableService,
    private activeRouter: ActivatedRoute,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private notConnected: NotConnectedToast
  ) {
    this.bookingForm = this.fb.group({
      guests: [0, [Validators.required, Validators.min(1)]],
      date: ['', Validators.required],
      time: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      notes: [''],
      tableId:[''],
    });
  }

  ngOnInit() {
    this.activeRouter.queryParamMap.subscribe((params: any) => {
      this.bookingForm.get('tableId')?.setValue(params.params.id)
      this.tableService.getTableById(params.params.id).subscribe((res: any) => {
        this.isLoader.set(false);
        this.table.set(res);
      })
    })
  }
 
  minusGuests() {
    const guests = this.bookingForm.get('guests')?.value;
    if (guests > 1) {
      this.bookingForm.get('guests')?.setValue(guests - 1);
    }
  }

  plusGuests() {
    const guests = this.bookingForm.get('guests')?.value;
    this.bookingForm.get('guests')?.setValue(guests + 1);
  }

  
  onDateChange(event: any) {
    const rawDate = event.detail.value;
    const formattedDate = this.datePipe.transform(rawDate, 'yyyy-MM-dd');
    this.bookingForm.get('date')?.setValue(formattedDate);
    this.bookingForm.get('time')?.setValue('');
    if(formattedDate){
      this.generateTimeSlots(formattedDate);
    }
  }

  /** Half-hour slots from 00:00 to 23:00 (local time); for today, only slots not yet passed. */
  generateTimeSlots(selectedDate: string) {
    const startHour = 0;
    const endHour = 23;
    const slots: string[] = [];
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const isToday = selectedDate === today;
    // Parse YYYY-MM-DD as a LOCAL date (new Date('YYYY-MM-DD') would be UTC).
    const [y, m, d] = selectedDate.split('-').map(Number);
    const startTime = new Date(y, m - 1, d, startHour, 0, 0, 0);

    if (isToday) {
      while (startTime < now) {
        startTime.setMinutes(startTime.getMinutes() + 30);
      }
    }
    for (; startTime.getDate() === d && (startTime.getHours() < endHour || (startTime.getHours() === endHour && startTime.getMinutes() <= 0)); startTime.setMinutes(startTime.getMinutes() + 30)) {
      slots.push(`${pad(startTime.getHours())}:${pad(startTime.getMinutes())}`);
    }
    this.timeSlots = slots;
  }


  getTime(slot:string){
    this.bookingForm.get('time')?.setValue(slot);
  }

  submit(){
    this.isSubmit =true;
    if (this.bookingForm.valid){
      const uid = localStorage.getItem('uid')
      if (uid){
        this.isSubmit =false;
        this.isLoader.set(true);
        const rawValue = this.bookingForm.getRawValue();
        this.tableService.addTable(rawValue,uid).pipe(
          switchMap(() => this.tableService.addToUserTable(uid,rawValue))
        ).subscribe((res:any)=>{  
          this.isLoader.set(false);
          this.routerLink.navigateUrl('/main/table-confirm', undefined);
        }, () => {
          this.isLoader.set(false);
          this.notConnected.show();
        })
      }
    } else{
      this.bookingForm.markAllAsTouched();
    }
  }
}
