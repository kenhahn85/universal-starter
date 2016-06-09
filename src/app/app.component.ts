import {Component, Directive, ElementRef, Injectable, Renderer} from '@angular/core';
import {RouteConfig, ROUTER_DIRECTIVES} from '@angular/router-deprecated';
import {Http} from '@angular/http';

import { BaseService, HeroService, RuntimeErrorHandler } from './fake.service';

// TEMPORARY
declare interface Window { _seedData: {string: [string|number, any]}; }
declare var window: Window;

declare type Json = JsonObject | number | string | JsonArray;
declare type JsonArray = IMaybeRecursiveArray<JsonObject | number | string>;
interface IMaybeRecursiveArray<T> {
  [i: number]: T | IMaybeRecursiveArray<T>;
}
interface JsonObject {
  [paramKey: string]: Json
}

/////////////////////////
// ** Example Directive
// Notice we don't touch the Element directly
@Directive({
  selector: '[x-large]'
})
export class XLarge {
  constructor(element: ElementRef, renderer: Renderer) {
    // ** IMPORTANT **
    // we must interact with the dom through -Renderer-
    // for webworker/server to see the changes
    renderer.setElementStyle(element.nativeElement, 'fontSize', 'x-large');
    // ^^
  }
}

/////////////////////////
// ** Example Components
@Component({
  selector: 'home',
  template: `
    <div>This is the "Home" page</div>
  `
})
export class Home { }

@Component({
  selector: 'about',
  template: `
    <div>This is the "About" page</div>
  `
})
export class About { }

@Component({
  template: `
    <script>
        window.seedData = JSON.parse('{{ seedData }}'); 
    </script>
  `
})
export class SeedDataInjector {
  // if on NodeJS, populate this from all Services somehow. Define this mechanism in base service. Otherwise, ignore.
  // TODO: place this in app component body
  seedData () {

  }
}

class ConsoleErrorHandler extends RuntimeErrorHandler {
  assertionFailed(...msg: string[]) {
    console.log('Assertion Failed:', ...msg);
  }
  onError(error: Error) {
    console.log('Error:', error);
  }
}

/////////////////////////
// ** MAIN APP COMPONENT **
@Component({
  selector: 'app', // <app></app>
  directives: [
    ...ROUTER_DIRECTIVES,
    XLarge
  ],
  providers:[
    HeroService,
    // TODO: reconsider location of this class
    {provide: RuntimeErrorHandler, useClass: ConsoleErrorHandler}
  ],
  styles: [`
    * { padding:0; margin:0; }
    #universal { text-align:center; font-weight:bold; padding:15px 0; }
    nav { background:#158126; min-height:40px; border-bottom:5px #046923 solid; }
    nav a { font-weight:bold; text-decoration:none; color:#fff; padding:20px; display:inline-block; }
    nav a:hover { background:#00AF36; }
    .hero-universal { min-height:500px; display:block; padding:20px; background: url('/src/logo.png') no-repeat center center; }
    .inner-hero { background: rgba(255, 255, 255, 0.75); border:5px #ccc solid; padding:25px; }
    .router-link-active { background-color: #00AF36; }
    blockquote { border-left:5px #158126 solid; background:#fff; padding:20px 20px 20px 40px; }
    blockquote::before { left: 1em; }
    main { padding:20px 0; }
    pre { font-size:12px; }
  `],
  template: `
  <h3 id="universal">Angular2 Universal</h3>
  <nav>
    <a [routerLink]=" ['./Home'] ">Home</a>
    <a [routerLink]=" ['./About'] ">About</a>
  </nav>
  <div class="hero-universal">
    <div class="inner-hero">
      <div>
        <span x-large>Universal JavaScript {{ title }}!</span>
      </div>

      Two-way binding: <input type="text" [value]="title" (input)="title = $event.target.value" autofocus>
      <br><br>

      <strong>Async data call return value:</strong>
      <script>window._seedData = {};</script>
      
      <div *ngFor="let service of services">
        <div *ngIf="service.dataKey">
          <script>window._seedData['{{service.dataKey}}'] = JSON.parse('{{ service.dumpJson() }}');</script>
          <script>console.log('set seed data for {{service.dataKey}}');</script>
        </div>
      </div>
      
      <div *ngFor="let hero of (heroService.observable | async).values()">
        <h1>{{hero.id}}: {{hero.name}}</h1> 
      </div>

      <strong>Router-outlet:</strong>
      <main>
        <router-outlet></router-outlet>
      </main>

      <blockquote>{{ server }}</blockquote>
    </div>
  </div>
  `
})
@RouteConfig([
  { path: '/', component: Home, name: 'Home', useAsDefault: true },
  { path: '/home', component: Home, name: 'Home' },
  { path: '/about', component: About, name: 'About' },
  { path: '/**', redirectTo: ['Home'] }
])
export class App {
  data = {};
  server: string;
  services: [BaseService<any, any>];
  title: string = 'ftw';

  constructor(public heroService: HeroService, public http: Http) {
    this.services = [
      heroService
    ];
  }

  ngOnInit() {
    setTimeout(() => {
      if (typeof window === 'undefined') {
        this.server = 'This was rendered from the server!';
      } else {
        this.server = 'This was rendered from the client!';
      }
    }, 2000);

    if (typeof window !== 'undefined') {
      this.data = window._seedData;
    }

    this.http.get('/data.json')
      .subscribe(res => {
        this.data = res.json();
      });
  }

}
