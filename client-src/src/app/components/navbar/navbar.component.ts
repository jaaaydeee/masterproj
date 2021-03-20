import { Component, OnInit } from '@angular/core';
import { NgFlashMessageService } from 'ng-flash-messages';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(
    private ngFlashMessageService: NgFlashMessageService,
    public authService:AuthService,
    private router:Router
    ) { }

  lastname: string = "";
  firstname: string = "";

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.lastname = 'LastName' in user ? user.LastName.trim() : "";
      this.firstname = 'FirstName' in user ? user.FirstName.trim() : "";
    }
    const userType = this.authService.getType();
  }

  onLogoutClick() {
    this.authService.logout();
    this.ngFlashMessageService.showFlashMessage({
      messages: ['You are now logged out'], 
      dismissible: true, 
      timeout: 3000,
      type: 'success'
    });
    this.router.navigate(['/login']);
    return false;
  }
}
