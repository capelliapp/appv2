import { Injectable } from '@angular/core';
import { SQLite } from 'ionic-native';

const win: any = window;

@Injectable()
export class DbStorage {
    static BACKUP_LOCAL = 2;
    static BACKUP_LIBRARY = 1;
    static BACKUP_DOCUMENTS = 0;
    static SCHEMA_VERSION = 6;
    static DB_NAME = `camra.sqlite.${DbStorage.SCHEMA_VERSION}`;

    private _sqlite: any;
    private _readyPromise;

    public constructor() {
        console.log('DbStorage: constructor');
    }

    public ready(): Promise<any> {
        if (!this._readyPromise) {
            this._readyPromise = this._initialise();
        }
        return this._readyPromise;
    }

    private _initialise() {
        let thisDbStorage = this;
        console.log('DbStorage: Initialise');
        return new Promise((resolve, reject) => {
            try {
                if (win.sqlitePlugin) {
                    console.log('Initialising SQLite object');
                    this._sqlite = new SQLite();

                    console.log('DbStorage: EnsureOpen - Opening SQLite database');
                    thisDbStorage._sqlite.openDatabase({
                        name: DbStorage.DB_NAME,
                        location: 'default',
                        createFromLocation: 0,
                        backupFlag: DbStorage.BACKUP_LOCAL
                    }).then(() => {
                        // TODO - reduce nesting
                        console.log('DbStorage: EnsureOpen - Opened SQLite');
                        return thisDbStorage.initKvp().then(() => resolve());
                    });
                } else {
                    console.warn('DbStorage: EnsureOpen - SQLite plugin not installed, falling back to WebSQL. Make sure to install cordova-sqlite-storage in production!');
                    thisDbStorage._sqlite = win.openDatabase(DbStorage.DB_NAME, '1.0', 'database', 5 * 1024 * 1024);
                    // WebSQL so we're already open so continue?
                    console.log('DbStorage: EnsureOpen - Opened WebSQL');
                    return thisDbStorage.initKvp().then(() => resolve());
                }
            } catch (error) {
                console.error('DbStorage: EnsureOpen - There was a problem opening the SQLite database');
                console.error(error);
                return reject(error);
            }
        });
    }

    private initKvp(): Promise<any> {
        console.log('DbStorage: Initialising KVP');
        // Call _internalQuery as we should have opened the database before doing this
        return this._internalQuery('CREATE TABLE IF NOT EXISTS kvp (key text primary key, value text)').catch(dbError => {
            console.error('DbStorage: Unable to create KVP table', dbError.tx, dbError.err);
        });
    }

    private _internalQuery(sql: string, params?: any): Promise<any> {
        if (win.sqlitePlugin) {
            return this._sqlite.executeSql(sql, params);
        }
        // This is WebSQL
        return new Promise((resolve, reject) => {
            try {
                // console.log('Executing WebSQL query...');
                this._sqlite.transaction((tx: any) => {
                    tx.executeSql(sql, params,
                        (tx: any, res: any) => resolve({ tx: tx, rows: res.rows }),
                        (tx: any, err: any) => reject({ tx: tx, err: err }));
                },
                    (err: any) => reject({ err: err }));
            } catch (err) {
                reject({ err: err });
            }
        });
    };

    public query(sql: string, params?: any): Promise<any> {
        return this.ready().then(() => {
            return this._internalQuery(sql, params);
        });
    }

    /**
     * Get the value in the database identified by the given key.
     * @param {string} key the key
     * @return {Promise} that resolves or rejects with an object of the form { tx: Transaction, res: Result (or err)}
     */
    public getKey(key: string) {
        console.log(`DbStorage: getKey for ${key}`);
        return this.query('select value from kvp where key=? limit 1', [key]).then(data => {
            if (data.rows.length > 0) {
                return data.rows.item(0).value;
            }
        });
    }

    /**
    * Set the value in the database for the given key. Existing values will be overwritten.
    * @param {string} key the key
    * @param {string} value The value (as a string)
    * @return {Promise} that resolves or rejects with an object of the form { tx: Transaction, res: Result (or err)}
    */
    public setKey(key: string, value: any): Promise<any> {
        console.log(`DbStorage: setKey for ${key}`);
        return this.query('insert or replace into kvp (key, value) values (?, ?)', [key, value]);
    }

    /**
    * Remove the value in the database for the given key.
    * @param {string} key the key
    * @return {Promise} that resolves or rejects with an object of the form { tx: Transaction, res: Result (or err)}
    */
    public removeKey(key: string): Promise<any> {
        console.log(`DbStorage: removeKey for ${key}`);
        return this.query('delete from kvp where key=?', [key]);
    }

    /**
    * Clear all keys/values of your database.
    * @return {Promise} that resolves or rejects with an object of the form { tx: Transaction, res: Result (or err)}
    */
    public clearKeys(key: string, value: any): Promise<any> {
        console.log(`DbStorage: clearKeys`);
        return this.query('delete from kvp');
    }
}
