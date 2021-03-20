import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  constructor(private authService:AuthService) { }

  showSidebar:boolean = true;

  toogleNav() {
    console.log("What did you expect would happen?");
    this.showSidebar = !this.showSidebar;
  }
}
