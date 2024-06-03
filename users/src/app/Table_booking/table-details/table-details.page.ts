import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { RoutingService } from 'src/app/service/routing.service';
import { TableService } from 'src/app/service/table.service';
import * as moment from 'moment';

@Component({
  selector: 'app-table-details',
  templateUrl: './table-details.page.html',
  styleUrls: ['./table-details.page.scss'],
})
export class TableDetailsPage implements OnInit {
  segment: string = 'booking';
  table: any;
  bookingValue: any ={};
  bookingForm: FormGroup;
  isLoader:boolean=true;
  isSubmit:boolean=false;
  timeSlots: string[] = [];
  constructor(
    public routerLink: RoutingService,
    private tableService: TableService,
    private activeRouter: ActivatedRoute,
    private datePipe: DatePipe,
    private fb: FormBuilder
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
        this.isLoader=false;
        this.table = res;
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

  generateTimeSlots(selectedDate: string) {
    const startHour = 0; 
    const endHour = 23; 
    const slots = [];
    const currentTime = moment();
    const isToday = selectedDate === currentTime.format('YYYY-MM-DD');
    let startTime = moment(selectedDate).startOf('day').add(startHour, 'hours');

    if (isToday) {
        while (startTime.isBefore(currentTime)) {
            startTime.add(30, 'minutes');
        }
    }
    for (; startTime.hour() < endHour || (startTime.hour() === endHour && startTime.minute() <= 0); startTime.add(30, 'minutes')) {
        slots.push(startTime.format('HH:mm'));
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
        this.isLoader=true;
        const rawValue = this.bookingForm.getRawValue();
        this.tableService.addTable(rawValue,uid).pipe(
          switchMap(() => this.tableService.addToUserTable(uid,rawValue))
        ).subscribe((res:any)=>{  
          this.isLoader=false;
          this.routerLink.navigateUrl('/main/table-confirm', undefined);
        })
      }
    } else{
      this.bookingForm.markAllAsTouched();
    }
  }
}
