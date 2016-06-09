import './rxjs-operators';

import {List, Map} from 'immutable';
import {every} from 'lodash';

import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import {Action, TODO} from "./utils/decorators";


// TMP
declare interface Window { _seedData: {string: [string|number, any]}; }
declare var window: Window;

function getSeedData(key: string): any {
  return window._seedData[key];
}


declare type Json = JsonObject | number | string | JsonArray;
declare type JsonArray = IMaybeRecursiveArray<JsonObject | number | string>;
interface IMaybeRecursiveArray<T> {
  [i: number]: T | IMaybeRecursiveArray<T>;
}
interface JsonObject {
  [paramKey: string]: Json
}

interface CurrentUser {
  userId: number;
}

// the idea is that the behavior would vary depending on the env.
export abstract class RuntimeErrorHandler {
  abstract assertionFailed(...msg: string[]): void;
  abstract onError(error: Error): void;
}

// class Hero {
//   id: number;
//   name: string;
// }

@Injectable()
export abstract class BaseService<K, V> {
  public get dataKey(): string | null { return null; }
  protected _seeded: boolean;
  protected readonly _subject: BehaviorSubject<Map<K, V>> = new BehaviorSubject(Map<K, V>([]));
  public readonly observable: Observable<Map<K, V>> = this._subject.asObservable();
  protected readonly _endpointUrl: string;
  protected readonly _idAttribute: string = 'id';

  constructor (protected _http: Http, protected _errorHandler: RuntimeErrorHandler) {
    this.refresh();
  }

  // TODO: protect from rapid multiple calls, throttle decorator?
  protected _loadAll(): Observable<Array<[K, V]>> {
    const base = this._http.get(this._endpointUrl).map(this._extractData);
    // TODO: retry on failure?
    return base.catch(this._onError);
  };

  // TODO: polish this
  protected _onError(error: Error) {
    this._errorHandler.onError(error);
    return Observable.throw(error);
  }

  /**
   * there may be non-array responses in the future, but this is fine for now
   *
   * @param response
   * @returns {any|Array}
   * @private
   */
  protected _extractData(response: Response): Array<[K, V]> {
    return (response.json().data || [])
      .map(v => this._typeCheck(v))
      .map(v => [v[this._idAttribute], v]);
  }

  protected _typeCheck(obj: any): V {
    if (this._typeGuard(obj)) {
      return obj;
    } else {
      throw new Error('This data does not conform to the expected schema');
    }
  }

  protected _loadOne(key: K): Observable<V> {
    // ACTIONABLE TODO abstract param construction: https://github.com/calebmer/postgrest-client
    return this._http.get(`${this._endpointUrl}?id=eq.${key}`)
      .map(this._typeCheck)
      // TODO: retry on failure?
      .catch(this._onError);
  }

  protected abstract _typeGuard(obj: any): obj is [K, V];

  protected _seed() {
    if (typeof window !== 'undefined' && !this._seeded && this.dataKey) {
      this._seeded = true;

      const seedData = getSeedData(this.dataKey);
      if (every(seedData, this._typeCheck.bind(this))) {
        console.log('seedData', seedData);
        this._subject.next(Map<K, V>(seedData));
        return true;
      } else {
        this._errorHandler.assertionFailed('The seed data does not match the expected schema.', seedData);
      }
    }

    return false;
  }

  refresh() {
    if (!this._seed()) {
      this._loadAll().toPromise().then(values => {
        this._subject.next(Map<K, V>(values));
      });
    }
  }

  abstract dumpJson(): string;
}


export class Hero {
  constructor(public id: number, public name: string) {}
}

export const HEROES: Hero[] = [
  new Hero(11, "Mr. Nice"),
  new Hero(12, "Narco"),
  new Hero(13, "Bombasto"),
  new Hero(14, "Celeritas"),
  new Hero(15, "Magneta"),
  new Hero(16, "RubberMan"),
  new Hero(17, "Dynama"),
  new Hero(18, "Dr IQ"),
  new Hero(19, "Magma"),
  new Hero(20, "Tornado")
];


@Injectable()
export class HeroService extends BaseService<number, Hero> {
  public get dataKey() { return 'heroes' };

  @Action
  async getHero(id: number) {
    // lodash find or whatever
    return Promise.resolve(this._subject.getValue().find(h => h ? h.id === id : false));
  }

  constructor (protected _http: Http, protected _errorHandler: RuntimeErrorHandler) {
    super(_http, _errorHandler);
  }

  _typeGuard(obj: any): obj is [number, Hero] {
    function isHero(val: any) {
      return typeof val.id === 'number' && typeof val.name === 'string';
    }

    return typeof obj[0] === 'number' && typeof obj[1].id === 'number' && typeof obj[1].name === 'string';
  }

  protected _loadAll() {
    const initialHeroes: Array<[number, Hero]> = HEROES.map<[number, Hero]>(h => [h.id, h]);
    if (typeof window === 'undefined') {
      return Observable.of<Array<[number, Hero]>>(initialHeroes);
    } else {
      console.log("This shouldn't be called...This happens when in browser, and loadAll is called, " +
        "which is a code path that I have disallowed in this demo.");
      return Observable.of<Array<[number, Hero]>>(initialHeroes);
    }
  }

  dumpJson(): string {
    return JSON.stringify(
      this._subject.getValue() ? this._subject.getValue().toArray().map(v => [v.id, v]) : []
    );
  }

  // TODO
  updateHero(hero: Hero) {
    // const heroes = this._subject.getValue();
    // heroes.find(h => h ? h.id === hero.id : false);
    // this._subject.next(heroes.merge(HEROES));
  }
}
