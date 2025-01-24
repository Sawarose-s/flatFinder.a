import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material.module';
import { RouterModule } from '@angular/router';

import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  imports: [CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  submitted = false;
  showSpinner = false;
  passwordFieldType: string = 'password';

  loginForm = new FormGroup({
    email: new FormControl<string | null>('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl<string | null>('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern('^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\d\s]).{5,}$')
    ]),
  });

  constructor(private auth: Auth, 
    private authService: AuthService,
    private router: Router) {}

    onSubmit() {
      if (this.loginForm.valid) {
        const { email, password } = this.loginForm.value;
        signInWithEmailAndPassword(this.auth, email!, password!)
          .then(async (userCredential) => {
            const user = userCredential.user;
            console.log('Login successful', user);
    
            // เรียกใช้ checkIfAdmin ผ่าน authService
            const isAdmin = await this.authService.checkIfAdmin(user.uid);
            if (isAdmin) {
              console.log('Admin logged in');
              this.router.navigate(['/admin-dashboard']); // เปลี่ยนไปยังหน้า Admin
            } else {
              this.router.navigate(['/home']); // ถ้าไม่ใช่ Admin ให้ไปหน้า Home
            }
          })
          .catch((error) => {
            console.error('Login failed:', error);
            if (error.code === 'auth/wrong-password') {
              alert('Incorrect password. Please try again.');
            } else if (error.code === 'auth/user-not-found') {
              alert('User not found. Please check your email.');
            }
          });
      }
    }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  async loginAdmin() {
    const adminEmail = 'admin@mail.com';
    const adminPassword = 'admin@11';
  
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, adminEmail, adminPassword);
      const user = userCredential.user;
  
      // เรียกใช้ checkIfAdmin ผ่าน authService
      const isAdmin = await this.authService.checkIfAdmin(user.uid);
      if (isAdmin) {
        console.log('Admin logged in successfully');
        this.router.navigate(['/admin-dashboard']); // ไปหน้าแดชบอร์ดของแอดมิน
      } else {
        alert('Access Denied. You are not an admin.');
      }
    } catch (error) {
      console.error('Login failed: ', error);
    }
  
}
}
