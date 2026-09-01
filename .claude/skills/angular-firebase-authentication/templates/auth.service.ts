import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  User,
  user,
  authState,
  idToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  UserCredential
} from '@angular/fire/auth';

export interface AuthError {
  code: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  // Estado reactivo con Signals
  readonly user$ = user(this.auth);
  readonly authState$ = authState(this.auth);
  readonly idToken$ = idToken(this.auth);

  readonly currentUser = toSignal(this.user$, { initialValue: null });
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAnonymous = computed(() => this.currentUser()?.isAnonymous ?? false);
  readonly isEmailVerified = computed(() => this.currentUser()?.emailVerified ?? false);
  readonly displayName = computed(() => this.currentUser()?.displayName ?? null);
  readonly email = computed(() => this.currentUser()?.email ?? null);
  readonly photoURL = computed(() => this.currentUser()?.photoURL ?? null);
  readonly uid = computed(() => this.currentUser()?.uid ?? null);

  // ============================================
  // EMAIL / PASSWORD
  // ============================================

  async register(email: string, password: string, displayName?: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);

    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }

    return credential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async sendVerificationEmail(): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      await sendEmailVerification(currentUser);
    }
  }

  async changePassword(newPassword: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      await updatePassword(currentUser, newPassword);
    }
  }

  async reauthenticate(password: string): Promise<UserCredential> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error('No authenticated user');
    }

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    return reauthenticateWithCredential(currentUser, credential);
  }

  // ============================================
  // SOCIAL PROVIDERS
  // ============================================

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  async loginWithFacebook(): Promise<User> {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');

    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  async loginWithGitHub(): Promise<User> {
    const provider = new GithubAuthProvider();
    provider.addScope('read:user');
    provider.addScope('user:email');

    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  async loginWithMicrosoft(): Promise<User> {
    const provider = new OAuthProvider('microsoft.com');
    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  async loginWithApple(): Promise<User> {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  // ============================================
  // ANONYMOUS
  // ============================================

  async loginAnonymously(): Promise<User> {
    const credential = await signInAnonymously(this.auth);
    return credential.user;
  }

  async convertAnonymousToEmail(email: string, password: string, displayName?: string): Promise<User> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.isAnonymous) {
      throw new Error('No anonymous user');
    }

    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(currentUser, credential);

    if (displayName) {
      await updateProfile(result.user, { displayName });
    }

    return result.user;
  }

  async convertAnonymousToGoogle(): Promise<User> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.isAnonymous) {
      throw new Error('No anonymous user');
    }

    const provider = new GoogleAuthProvider();
    const result = await linkWithPopup(currentUser, provider);
    return result.user;
  }

  // ============================================
  // PROFILE
  // ============================================

  async updateUserProfile(profile: { displayName?: string; photoURL?: string }): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      await updateProfile(currentUser, profile);
    }
  }

  // ============================================
  // TOKENS
  // ============================================

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      return currentUser.getIdToken(forceRefresh);
    }
    return null;
  }

  async getIdTokenResult(forceRefresh = false) {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      return currentUser.getIdTokenResult(forceRefresh);
    }
    return null;
  }

  // ============================================
  // PROVIDERS
  // ============================================

  getLinkedProviders(): string[] {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      return currentUser.providerData.map(p => p.providerId);
    }
    return [];
  }

  isProviderLinked(providerId: string): boolean {
    return this.getLinkedProviders().includes(providerId);
  }
}
