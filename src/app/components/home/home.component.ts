import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { CommonModule } from '@angular/common';
 
import { AuthService } from '../../auth.service';
import { Firestore, doc, getDoc, collection, getDocs, setDoc, addDoc, onSnapshot, Timestamp, deleteDoc } from '@angular/fire/firestore';
 
import { Auth } from '@angular/fire/auth';
 
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, } from 'rxjs/operators';
import { collectionData } from '@angular/fire/firestore';
import { query, where } from 'firebase/firestore';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
 
 
interface Flat {
  id: string;
  messages?: any[]; // คุณสามารถกำหนดประเภทของ messages ได้ถ้าทราบโครงสร้าง
  addedBy?: { firstName: string, email: string };
  isFlatviewOpen?: boolean;
}
 
@Component({
  selector: 'app-home',
  imports: [CommonModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
 
  firstName: string = '';
  email: string = '';
  isLoggedIn: boolean = false;
 
  isFlatview = false;
  showMessage = false;
  messageForms: { [key: string]: FormGroup } = {};
 
  flats$: any = [];
 
  private destroy$ = new Subject<void>();
  favorites: Set<string> = new Set();
  favoritesSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  favFlats$!: Observable<any[]>;
 
  loading: boolean = true;
  filterForm: FormGroup;
  filteredFlats$: any[] = [];
 
  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private auth: Auth,
    private fb: FormBuilder)
    {this.filterForm = this.fb.group({
      searchText: [''],
      priceRange: [50]
    });}
 
    ngOnInit() {
 
      this.fetchAllFlats();
 
      this.authService.user$.subscribe(user => {
        console.log('User status in ngOnInit: ', user);
        if (user) {
          this.isLoggedIn = true;
          // this.fetchUserFlats(user.uid);
          this.fetchUserFirstName(user.uid);
          this.updateFavorites();
          this.fetchAllFlats();
        } else {
          this.isLoggedIn = false;
        }
      });
 
      this.authService.user$.subscribe(user => {
        if (user) {
          const favoritesCollection = collection(this.firestore, `users/${user.uid}/favorites`);
          const favoritesQuery = query(favoritesCollection); // ใช้ query แทน collection ตรงๆ
 
          this.favFlats$ = collectionData(favoritesQuery, { idField: 'id' }); // ใช้ query ที่สร้างขึ้น
        }
      });
 
      this.authService.favoritesSubject
        .pipe(takeUntil(this.destroy$))
        .subscribe((favorites: string[]) => {
          this.favorites = new Set(favorites); // If you need a Set<string>
          this.loadFavoriteFlats(favorites); // No need to convert to an array if it's already an array
        });
 
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.applyFilters());
  }
 
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
  // ฟังก์ชันดึง firstName จาก Firestore
  async fetchUserFirstName(uid: string) {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`); // ใช้ backticks เพื่อสร้าง string ที่รวมกับ uid
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.firstName = userData?.['firstName'] || 'User'; // ถ้าไม่มี firstName ให้แสดงเป็น 'User'
      } else {
        this.firstName = 'User'; // กรณีที่ไม่พบข้อมูลใน Firestore
      }
    } catch (error) {
      console.error('Error fetching user first name:', error);
      this.firstName = 'User'; // ถ้ามีข้อผิดพลาด
    }
  }
 
  // important
async fetchAllFlats() {
  try {
    const flatsCollection = collection(this.firestore, 'flats');
    const flatsSnapshot = await getDocs(flatsCollection);
 
    this.flats$ = await Promise.all(
      flatsSnapshot.docs.map(async (docSnapshot) => {
        const flatData = docSnapshot.data() as { [key: string]: any };
        flatData['id'] = docSnapshot.id;
 
        const addedByUid = flatData['addedBy']?.uid;
        if (addedByUid) {
          const userDocRef = doc(this.firestore, `users/${addedByUid}`);
          const userDocSnapshot = await getDoc(userDocRef);
          flatData['addedBy'] = userDocSnapshot.exists()
            ? userDocSnapshot.data()
            : { firstName: 'Desconhecido', email: 'N/A' };
        } else {
          flatData['addedBy'] = { firstName: 'firstName', email: 'N/A' };
        }
 
        this.messageForms[flatData['id']] = this.fb.group({
          content: ['', Validators.required]
        });
 
        return flatData;
      })
    );
 
    // Aplica o array completo dos flats também em filteredFlats$,
    // para que o filtro funcione normalmente
    this.filteredFlats$ = this.flats$;
  } catch (error) {
    console.error('Erro ao buscar todos os flats:', error);
  }
}
 
 
// ฟังก์ชันดึงข้อมูล flats จาก Firestore
async fetchUserFlats(uid: string) {
  try {
    // ใช้ backticks เพื่อรวมตัวแปร uid ใน path
    const flatsCollection = collection(this.firestore, `users/${uid}/flats`);
    const flatsSnapshot = await getDocs(flatsCollection);
    const user = this.auth.currentUser;
 
    let userFirstName = 'Unknown';
    if (user) {
      // ใช้ backticks ในการรวม uid ของ user
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        userFirstName = userData['firstName'] || 'Unknown';
      }
    }
 
    this.flats$ = await Promise.all(flatsSnapshot.docs.map(async (docSnapshot) => {
      const flatData = docSnapshot.data() as { [key: string]: any };
      flatData['id'] = docSnapshot.id;  // Add the id if it's not already present
 
      const addedByUid = flatData['addedBy']?.uid;
      if (addedByUid) {
        // ใช้ backticks ในการรวม uid ของผู้ที่เพิ่ม flat
        const userDocRef = doc(this.firestore, `users/${addedByUid}`);
        const userDocSnapshot = await getDoc(userDocRef);
        flatData['addedBy'] = userDocSnapshot.exists() ? userDocSnapshot.data() : { firstName: 'Unknown', email: 'N/A' };
      } else {
        flatData['addedBy'] = { firstName: userFirstName, email: user?.email || 'N/A' };
      }
 
      // Initialize a form group for each flat
      this.messageForms[flatData['id']] = this.fb.group({
        content: ['', Validators.required]
      });
 
      return flatData;
    }));
 
    this.filteredFlats$ = this.flats$;
  } catch (error) {
    console.error('Error fetching flats:', error);
  }
}
 
 
async loadFlatMessages(flatId: string) {
  const flatIndex = this.flats$.findIndex((flat: any) => flat.id === flatId);
  if (flatIndex > -1) {
    const flat = this.flats$[flatIndex];
    flat.isFlatviewOpen = !flat.isFlatviewOpen;
    if (flat.isFlatviewOpen) {
      // ใช้ backticks เพื่อรวม flatId ลงใน path
      const messagesCollection = collection(this.firestore, `flats/${flatId}/messages`);
      onSnapshot(messagesCollection, snapshot => {
        this.flats$[flatIndex].messages = snapshot.docs.map(doc => doc.data());
      });
    } else {
      this.flats$[flatIndex].messages = [];
    }
  }
}
 
 
async addMessage(flatId: string) {
  if (this.messageForms[flatId].invalid) return;
 
  const user = this.auth.currentUser;
  if (user) {
    const newMessage = {
      content: this.messageForms[flatId].value.content,
      sender: { firstName: this.firstName, email: user.email },
      timestamp: Timestamp.now()
    };
 
    try {
      const messagesCollection = collection(this.firestore, `flats/${flatId}/messages`);
      await addDoc(messagesCollection, newMessage);
      this.messageForms[flatId].reset();
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }
}
 
onSubmit(flatId: string): void {
  this.addMessage(flatId);
}
 
applyFilters() {
  const { searchText, priceRange } = this.filterForm.value;
 
  this.filteredFlats$ = this.flats$.filter((flat: any) => {
    const matchesText = (flat.city && flat.city.toLowerCase().includes(searchText.toLowerCase())) ||
                        (flat.streetName && flat.streetName.toLowerCase().includes(searchText.toLowerCase()));
 
    const matchesPrice = flat.rentPrice <= priceRange;  // Correct use of price range for filtering
 
    return matchesText && matchesPrice;
  });
}
 
 
updatePriceRange(event: any) {
  const price = event.value;
  // Update displayed price range
}
 
searchFlats() {
  this.applyFilters();
}
 
toggleFavorite(flat: Flat) {
  const user = this.auth.currentUser;
  if (user) {
    const favoriteDocRef = doc(this.firestore, `users/${user.uid}/favorites/${flat.id}`);
    const isFavorited = this.favorites.has(flat.id);
 
    if (isFavorited) {
      deleteDoc(favoriteDocRef); // ลบรายการออกจาก Firestore
      this.favorites.delete(flat.id); // อัปเดตสถานะในแอป
    } else {
      setDoc(favoriteDocRef, { flatId: flat.id }); // เพิ่มรายการใน Firestore
      this.favorites.add(flat.id); // อัปเดตสถานะในแอป
    }
 
    // อัปเดต UI และรีเฟรชข้อมูล favorites
    this.favoritesSubject.next(Array.from(this.favorites)); // อัปเดต UI
    this.updateFavorites();  // รีเฟรชข้อมูล favorites
  }
}
 
 
 
updateFavorites() {
  const user = this.auth.currentUser;
  if (user) {
    const favoritesCollection = collection(this.firestore, `users/${user.uid}/favorites`);
    const favoritesQuery = query(favoritesCollection);
 
    // ดึงข้อมูล favorites ล่าสุดจาก Firestore
    getDocs(favoritesQuery).then((snapshot) => {
      this.favorites.clear(); // เคลียร์ favorites ก่อน
      snapshot.docs.forEach(doc => {
        this.favorites.add(doc.id); // เพิ่มรายการโปรดใหม่จาก Firestore
      });
 
      // อัปเดตข้อมูล UI
      this.favoritesSubject.next(Array.from(this.favorites));
    }).catch(error => {
      console.error('Error fetching favorites:', error);
    });
  }
}
 
 
 
isFavorite(flat: any): boolean {
  return this.favorites.has(flat.id); // ตรวจสอบว่า flat.id อยู่ใน favorites หรือไม่
}
 
 
loadFavoriteFlats(favorites: string[]) {
  if (favorites.length === 0) {
    this.filteredFlats$ = [];
    return;
  }
 
  const flatsCollection = collection(this.firestore, 'flats');
  const flatsQuery = query(flatsCollection, where('id', 'in', favorites));
 
  collectionData(flatsQuery, { idField: 'id' })
    .pipe(takeUntil(this.destroy$))
    .subscribe(flats => {
      this.filteredFlats$ = flats;
    });
}
 
 
 
 
private async favoriteFlats(flatId: string) {
  try {
    const favoritesCollection = collection(this.firestore, `flats/${flatId}/favorites`);
    const favoritesSnapshot = await getDocs(favoritesCollection);
    this.favorites = new Set(favoritesSnapshot.docs.map(doc => doc.id));
    this.favoritesSubject.next(Array.from(this.favorites));
  } catch (error) {
    console.error('Error fetching favorite flats:', error);
  }
}
 
}