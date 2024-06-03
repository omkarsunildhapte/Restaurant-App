import { Component, OnInit } from '@angular/core';
import { RoutingService } from 'src/app/service/routing.service';
import { TableService } from 'src/app/service/table.service';

@Component({
  selector: 'app-table-confirm',
  templateUrl: './table-confirm.page.html',
  styleUrls: ['./table-confirm.page.scss'],
})
export class TableConfirmPage implements OnInit {
  isLoading: boolean = true;
  bookingValue: any
  constructor(
    public routerLink: RoutingService,
    private tableService: TableService
  ) {
  }

  ngOnInit() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      this.tableService.getTableBook(uid).subscribe((res: any) => {
        this.bookingValue = res[0];
        this.isLoading = false;
      })
    }
  }

}
