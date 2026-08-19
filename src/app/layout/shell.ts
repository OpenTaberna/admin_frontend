import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidenavComponent } from './sidenav';
import { TopbarComponent } from './topbar';

/**
 * Application frame: permanent sidenav, topbar, routed content.
 *
 * The drawer state lives here rather than in either child, so the topbar
 * toggle and the sidenav's own dismissal act on one piece of state.
 */
@Component({
  selector: 'ot-shell',
  standalone: true,
  imports: [RouterOutlet, SidenavComponent, TopbarComponent],
  template: `
    <div class="min-h-dvh">
      <ot-sidenav [open]="drawerOpen()" (closed)="drawerOpen.set(false)" />
      <div class="lg:pl-[var(--sidenav-width)]">
        <ot-topbar (menuToggled)="drawerOpen.set(!drawerOpen())" />
        <main class="mx-auto w-full max-w-[90rem] p-4 sm:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  readonly drawerOpen = signal(false);
}
