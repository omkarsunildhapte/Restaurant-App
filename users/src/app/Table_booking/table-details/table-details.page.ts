import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { RoutingService } from 'src/app/service/routing.service';
import { TableService } from 'src/app/service/table.service';

@Component({
  selector: 'app-table-details',
  templateUrl: './table-details.page.html',
  styleUrls: ['./table-details.page.scss'],
})
export class TableDetailsPage implements OnInit {
  segment: string = 'booking';
  table: any;
  bookingValue: any ={};
  constructor(
    public routerLink: RoutingService,
    private tableService: TableService,
    private activeRouter: ActivatedRoute,
    private datePipe: DatePipe
  ) {
    this.bookingValue.guests = 1;
  }

  ngOnInit() {
    this.activeRouter.queryParamMap.subscribe((params: any) => {
      this.bookingValue.tableId = params.params.id
      this.tableService.getTableById(params.params.id).subscribe((res: any) => {
        this.table = res;
        debugger
      })
    })
  }
  minusGuests() {
    if (this.bookingValue.guests > 0) {
      this.bookingValue.guests -= 1;
    }
  }

  plusGuests() {
    if (this.bookingValue.guests > 0) {
      this.bookingValue.guests += 1;
    }
  }
  
  onDateChange(event: any) {
    const rawDate = event.detail.value;
    this.bookingValue.date = this.datePipe.transform(rawDate, 'yyyy-MM-dd'); 
  }

  onTimeChange(event: any) {
    const rawTime = event.detail.value;
    this.bookingValue.time = this.datePipe.transform(rawTime, 'HH:mm');
  }
  
  submit(){
    if (this.bookingValue.time && this.bookingValue.date && this.bookingValue.guests){
      debugger
      const uid = localStorage.getItem('uid')
      if (uid){
        this.tableService.addTable(this.bookingValue,uid).pipe(
          switchMap(() => this.tableService.addToUserTable(uid,this.bookingValue))
        ).subscribe((res:any)=>{
          this.routerLink.navigateUrl('/main/track', undefined);
        })
      }
    }
  }
}
