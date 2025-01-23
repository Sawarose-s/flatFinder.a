import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material/material.module';
import { RouterModule } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { AuthService } from '../../../auth.service';
import { Firestore, doc, setDoc, collection, addDoc } from '@angular/fire/firestore'; // Import Firestore functions
import { getAuth } from '@firebase/auth';

import { inject, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth'; 

@Component({
  selector: 'app-new-flat',
  imports: [CommonModule,
      MaterialModule,
      FormsModule,
      ReactiveFormsModule,
      RouterModule,],
  templateUrl: './new-flat.component.html',
  styleUrl: './new-flat.component.css'
})
export class NewFlatComponent implements OnInit {

  addFlatForm = new FormGroup({
    city: new FormControl('', [Validators.required]),
    streetName: new FormControl('', [Validators.required]),
    streetNumber: new FormControl(null, [Validators.required]),
    areaSize: new FormControl(null, [Validators.required]),
    AC: new FormControl(false), // Default value for AC
    yearBuilt: new FormControl(null, [Validators.required]),
    rentPrice: new FormControl(null, [Validators.required]),
    dateAvailable: new FormControl('', [Validators.required])
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore,
    private auth: Auth // Inject Auth เพื่อให้แน่ใจว่า Firebase ได้ initialize แล้ว
  ) {}


  async ngOnInit() {
    // ตรวจสอบว่า Firebase app ได้ถูก initialize แล้ว
    if (!this.auth) {
      throw new Error('Firebase app has not been initialized');
    }
  }
  /*
  async onSubmit() {
    if (this.addFlatForm.invalid) {
      return;
    }
    // [todo]
    // when user saves flat, it should not go to his users/ path for saving
    // it should go to the main "flats/" collection
    const user = this.auth.currentUser; // ใช้ this.auth ที่ Inject มา
    if (user) {
      const flatData = this.addFlatForm.value;
      const flatsCollection = collection(this.firestore, `users/${user.uid}/flats`);

      try {
        await addDoc(flatsCollection, flatData);
        console.log('Flat added successfully');
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error adding flat:', error);
      }
        */

      async onSubmit() {
        if (this.addFlatForm.invalid) {
          return;
        }
        
        const user = this.auth.currentUser; // ใช้ this.auth ที่ Inject มา
      
        if (user) {
          const flatData = this.addFlatForm.value;
          const userFlatsCollection = collection(this.firestore, `users/${user.uid}/flats`);
          
          // สร้าง flatId ใหม่โดยใช้ doc() และไม่ต้องตั้งค่า flatId เอง
          const flatDocRef = doc(userFlatsCollection);
          const flatId = flatDocRef.id; // ดึง flatId จาก flatDocRef
          const globalFlatsCollection = collection(this.firestore, `flats`);
          const globalFlatDocRef = doc(globalFlatsCollection, flatId);
      
          try {
            // เพิ่ม flat ใน users/{userId}/flats
            await setDoc(flatDocRef, { ...flatData, id: flatId });
      
            // เพิ่ม flat ใน flats/{flatId}
            await setDoc(globalFlatDocRef, { ...flatData, id: flatId });
      
            console.log('Flat added successfully');
            this.router.navigate(['/home']);
          } catch (error) {
            console.error('Error adding flat:', error);
          }
        }
      }
      
}
