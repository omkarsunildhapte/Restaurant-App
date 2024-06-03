import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
   const auth = localStorage.getItem('uid');
   const router = inject(Router)
   if (!auth){
    router.navigate(['/login']);
    return false;
   }
  return true;
};
