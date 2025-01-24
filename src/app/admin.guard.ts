import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take, switchMap } from 'rxjs';
import { from, of } from 'rxjs';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    switchMap(user => {
      if (!user || !user.uid) {
        router.navigate(['/']);
        return of(false);
      }
      return from(authService.checkIfAdmin(user.uid)).pipe(
        map(isAdmin => {
          if (!isAdmin) {
            router.navigate(['/']);
            return false;
          }
          return true;
        })
      );
    })
  );
};
