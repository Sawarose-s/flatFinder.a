import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material/material.module';
import { Firestore, collection, getDocs, doc, getDoc, deleteDoc, setDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../../../auth.service';
import { firstValueFrom, Subject, Observable, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Flat {
  id: string;
  city?: string;
  streetName?: string;
  streetNumber?: string;
  areaSize?: string;
  AC?: boolean;
  rentPrice?: string;
  yearBuilt?: string;
  dateAvailable?: string;
  addedBy?: {
    firstName?: string;
    email?: string;
  };
}

@Component({
  selector: 'app-favourite',
  imports: [MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './favourite.component.html',
  styleUrls: ['./favourite.component.css']
})
export class FavouriteComponent implements OnInit, OnDestroy {
  //favFlats$: Array<{ id: string; city?: string; streetName?: string; streetNumber?: string; areaSize?: string; AC?: boolean; rentPrice?: string; yearBuilt?: string; dateAvailable?: string; addedBy?: { firstName: string; email: string } } | null> = [];
  private favFlatsSubject = new BehaviorSubject<Flat[]>([]);
  favFlats$ = this.favFlatsSubject.asObservable();
  favorites: Set<string> = new Set();
  loading: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private authService: AuthService
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.authService.updateFavorites(user.uid);
        this.authService.favoritesSubject
          .pipe(takeUntil(this.destroy$)) // Unsubscribe on destroy
          .subscribe(favorites => {
            this.favorites = new Set(favorites);
            this.loadFavoriteFlats(favorites);
          });
      } else {
        this.loading = false;
      }
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadFavoriteFlats(favorites: string[]) {
    this.loading = true;
    const flats = await Promise.all(favorites.map(async (flatId) => {
      const flatDocRef = doc(this.firestore, `flats/${flatId}`);
      const flatDocSnapshot = await getDoc(flatDocRef);
      return flatDocSnapshot.exists() ? { id: flatDocSnapshot.id, ...flatDocSnapshot.data() } : null;
    }));

    // กรองค่า null และอัพเดต BehaviorSubject
    this.favFlatsSubject.next(flats.filter(flat => flat !== null) as Flat[]);
    this.loading = false;
  }


  async toggleFavorite(flat: Flat) {
  const user = this.auth.currentUser;
  if (user) {
    const favoriteDocRef = doc(this.firestore, `users/${user.uid}/favorites/${flat.id}`);
    const isFavorited = this.favorites.has(flat.id);

    try {
      if (isFavorited) {
        await deleteDoc(favoriteDocRef);
        this.favorites.delete(flat.id);
      } else {
        await setDoc(favoriteDocRef, { flatId: flat.id });
        this.favorites.add(flat.id);
      }

      // อัปเดต BehaviorSubject
      this.authService.favoritesSubject.next(Array.from(this.favorites));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }
}

  

  

  // Check if the flat is favorited
  isFavorite(favFlat: any): boolean {
    return this.favorites.has(favFlat.id);
  }
}
