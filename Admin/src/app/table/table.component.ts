import { Component, ViewChild } from '@angular/core';
import { NewTableComponent } from './new-table/new-table.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NewTableComponent,ButtonModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
  itemList:any[]=[];
  @ViewChild('newValue', { static: false }) newValue!: NewTableComponent;
  headers = ['Name', 'Description', 'Price','Discount', 'Logo Image','Image','Action', ];
}
