import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CalendarView } from 'angular-calendar';

@Component({
  selector: 'mwl-calendar-header',
  templateUrl: './calender-header.component.html',
})
export class CalenderHeaderComponent {
  @Input() view: CalendarView;

  @Input() viewDate: Date;

  @Input() locale: string = 'en';

  @Input() hourBlock: number = 2;

  @Input() hourBlockToggle: boolean = false;

  @Output() hourBlockChange = new EventEmitter<Number>();

  @Output() viewChange = new EventEmitter<CalendarView>();

  @Output() viewDateChange = new EventEmitter<Date>();

  CalendarView = CalendarView;
}
