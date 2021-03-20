import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
  authToken:any;
  user:any;
  userType:any = null;
  isloggedIn: boolean = null;
  base_url: string = window.location.origin;

  constructor(private http:HttpClient) { }

  registerUser(user){
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    //return this.http.post(this.base_url+'/api/register', user, httpOptions);
    return this.http.post(this.base_url+'/api/register', user, httpOptions);  
  }

  authenticateUser(user) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post(this.base_url+'/api/auth', user, httpOptions);
  }

  loadToken() {
    const token = localStorage.getItem('id_token');
    this.authToken = token;
  }

  storeUserData(token: any, user: any): any {
    localStorage.setItem('id_token', token); 
    localStorage.setItem('user', JSON.stringify(user));
    this.authToken = token;
    this.user = user;
  }

  loggedIn() {
    // if (this.isloggedIn != null) {
    //   return this.isloggedIn;
    // }

    const myRawToken = localStorage.getItem('id_token');
    const helper = new JwtHelperService();
    if (myRawToken) {
      const isExpired = helper.isTokenExpired(myRawToken);
      if (!isExpired) {
        return true;
      }
    }
    return false;
  }

  logout() {
    this.authToken = null;
    this.user = null;
    localStorage.clear();
  }

  getUser() {
    if (this.user) {
      return this.user;
    }

    const user = localStorage.getItem('user');
    if (user) {
      this.user = JSON.parse(user);
      return this.user;
    }

    return null;
  }

  getType() : string {
    if (this.userType) {
      return this.userType;
    }

    const currentUser = this.getUser();
    if (currentUser) {
      if (currentUser.FacultyID) {
        this.userType = 'faculty';
      } else if (currentUser.StudentID) {
        this.userType = 'student';
      }
    }

    return this.userType;
  }

  isFaculty() {
    return this.getType() === 'faculty';
  }

  isStudent() {
    return this.getType() === 'student';
  }

}
