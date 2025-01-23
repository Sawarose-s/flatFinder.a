import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material.module';

import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';


@Component({
  selector: 'app-register',
  imports: [CommonModule,
    MaterialModule,
    ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  showSpinner = false;
  passwordFieldType: string = 'password';
  

  registrationForm = new FormGroup({
    firstName: new FormControl<string | null>('', [
      Validators.required, 
      Validators.minLength(2)]),
    lastName: new FormControl<string | null>('', [
      Validators.required, 
      Validators.minLength(2)]),
    birthDate: new FormControl('', [
      Validators.required, 
      Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]),
    email: new FormControl<string | null>('', [
      Validators.required, 
      Validators.email]),
    password: new FormControl<string | null>('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern('^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\d\s]).{5,}$')
    ])
  });

  constructor(private authService: AuthService) {}

  onSubmit() {
    const { firstName, lastName, birthDate, email, password } = this.registrationForm.value;

    // ตรวจสอบว่าค่าของ email และ password มีหรือไม่
  if (!email || !password) {
    alert('Please fill in all fields.');
    return;
  }
    const userData = {
      firstName: firstName,  // ใช้ค่าจาก formControlName
      lastName: lastName,
      birthDate: birthDate,  // ใช้ค่าจาก formControlName
      email: email,
      password: password
    };

  // การแสดงสปินเนอร์หรือข้อความระหว่างส่งคำขอ
  this.showSpinner = true;

  // เรียกใช้ฟังก์ชัน register ใน AuthService
  this.authService.register(email, password, userData).then(() => {
    this.showSpinner = false;
  }).catch(error => {
    this.showSpinner = false;
    alert('Error during registration: ' + error.message);
  });
}

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  
}
