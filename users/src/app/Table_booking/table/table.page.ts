import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RoutingService } from 'src/app/service/routing.service';
import { TableService } from 'src/app/service/table.service';
import Swiper from 'swiper';
@Component({
  selector: 'app-table',
  templateUrl: './table.page.html',
  styleUrls: ['./table.page.scss'],
})
export class TablePage implements OnInit {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;
  tables:any[] =[];
  constructor(
    public routerLink : RoutingService,
    private tableService:TableService
  ) { }

  ngOnInit() {
    this.tableService.getTable().subscribe((res:any)=>{
      this.tables = res;      
    })
  }
  ngAfterViewInit() {
    new Swiper(this.swiperContainer.nativeElement, {
      navigation: true,
      pagination: { clickable: true },
      scrollbar: { draggable: true }
    });
  }

  getTable(value:any){
    const selected= {
      id:value.id
    }
    this.routerLink.navigateUrl('/main/table-details',selected)
  }

}
