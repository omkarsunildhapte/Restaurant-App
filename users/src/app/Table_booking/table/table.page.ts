import { Component, OnInit } from '@angular/core';
import { RoutingService } from 'src/app/service/routing.service';
import { TableService } from 'src/app/service/table.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.page.html',
  styleUrls: ['./table.page.scss'],
})
export class TablePage implements OnInit {
  tables:any[] =[];

  constructor(
    public routerLink : RoutingService,
    private tableService:TableService
  ) { }

  ngOnInit() {
    this.tableService.getTable().subscribe((res:any)=>{
      
    })
  }

  getTable(value:any){
    const selected= {
      id:value.id
    }
    this.routerLink.navigateUrl('/main/table-details',selected)
  }

}
