import { Component, OnInit } from '@angular/core';
import { NgFlashMessageService } from 'ng-flash-messages';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string;
  password: string;
  data: any;
  
  constructor(
    private ngFlashMessageService: NgFlashMessageService,
    private authService:AuthService,
    private router:Router
    ) { }

  ngOnInit() {
  }

  onLoginSubmit() {
    const user = {
      Email: this.email,
      Password: this.password
    };

    this.authService.authenticateUser(user).subscribe(data => {
      this.data = data;
      if (this.data.success) {
        this.authService.storeUserData(this.data.token, this.data.user);

        this.ngFlashMessageService.showFlashMessage({
          messages: ['Login in Successful'], 
          dismissible: true, 
          timeout: 3000,
          type: 'success'
        });
        window.location.href=window.location.origin+"/dashboard";
        //this.router.navigate(['/dashboard']);
      } else {
        this.ngFlashMessageService.showFlashMessage({
          messages: [this.data.msg], 
          dismissible: true, 
          timeout: 3000,
          type: 'danger'
        });
        this.router.navigate(['/login']);
      }
    });
  }
}
