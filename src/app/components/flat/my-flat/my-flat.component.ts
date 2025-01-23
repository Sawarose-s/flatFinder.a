import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material/material.module';

import { Firestore, doc, setDoc, deleteDoc, collection, getDocs } from '@angular/fire/firestore';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-flat',
  imports: [CommonModule,
    RouterModule,
    MaterialModule,
    ReactiveFormsModule 
  ],
  templateUrl: './my-flat.component.html',
  styleUrl: './my-flat.component.css'
})
export class MyFlatComponent implements OnInit {
  flats$: any[] = [];
  isEditing = false;
  currentFlatId: string | null = null; // เก็บ ID ของ flat ที่กำลังแก้ไข
  editFlatForm: FormGroup;

  constructor(private firestore: Firestore, private auth: Auth) {
    this.editFlatForm = new FormGroup({
      city: new FormControl('', [Validators.required]),
      streetName: new FormControl('', [Validators.required]),
      streetNumber: new FormControl(null, [Validators.required]),
      areaSize: new FormControl(null, [Validators.required]),
      AC: new FormControl(false),
      rentPrice: new FormControl(null, [Validators.required]),
      yearBuilt: new FormControl(null, [Validators.required]),
      dateAvailable: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {
    this.loadFlats();
  }

  async loadFlats() {
    const user = this.auth.currentUser;
    if (user) {
      const flatsCollection = collection(this.firestore, `users/${user.uid}/flats`);
      const flatsSnapshot = await getDocs(flatsCollection);
      this.flats$ = flatsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  }

  // เริ่มการแก้ไข
  startEditing(flat: any) {
    this.isEditing = true;
    this.currentFlatId = flat.id;
    this.editFlatForm.setValue({
      city: flat.city,
      streetName: flat.streetName,
      streetNumber: flat.streetNumber,
      areaSize: flat.areaSize,
      AC: flat.AC,
      rentPrice: flat.rentPrice,
      yearBuilt: flat.yearBuilt,
      dateAvailable: flat.dateAvailable
    });
  }

  // บันทึกการแก้ไข
  async saveEdit() {
    if (!this.currentFlatId) {
      console.error('No flat selected for editing');
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      console.error('User is not signed in');
      return;
    }

    const updatedData = this.editFlatForm.value;
    const flatDocRef = doc(this.firestore, `users/${user.uid}/flats/${this.currentFlatId}`);
    try {
      await setDoc(flatDocRef, updatedData, { merge: true });
      console.log('Flat updated successfully');
      this.isEditing = false;
      this.currentFlatId = null;
      this.loadFlats(); // Reload the list to reflect changes
    } catch (error) {
      console.error('Error updating flat:', error);
    }
  }

  // ยกเลิกการแก้ไข
  cancelEdit() {
    this.isEditing = false;
    this.currentFlatId = null;
  }


  async deleteFlat(flatId: string) {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('User is not signed in');
      return;
    }

    const flatDocRef = doc(this.firestore, `users/${user.uid}/flats/${flatId}`);
    try {
      await deleteDoc(flatDocRef);
      console.log('Flat deleted successfully');
      this.flats$ = this.flats$.filter(flat => flat.id !== flatId);
    } catch (error) {
      console.error('Error deleting flat:', error);
    }
  }
}
