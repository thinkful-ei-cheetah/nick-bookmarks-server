# Bookmarks Server

This is a locally based server used to C.R.U.D. URL bookmarks.

## Set up

Complete the following steps to locally configure the server:

1. Clone this repository to your local machine `git clone SERVER-URL bookmarks-server`
2. `cd` into the cloned repository
3. Install node dependencies `npm install`
4. Create database and seed
     
   *Ex (postgresql):*
   ```
   $ createdb -U <username> -d <database_name>
   $ psql -d <database_name> -f /path/to/seed/file
   ```
5. Set up environment in `.env` including `API_TOKEN`, `PORT`, and database configurations: 

    ```
    API_TOKEN=
    PORT=
       
    DB_URL= 
    MIGRATION_DB_HOST=
    MIGRATION_DB_PORT= 
    MIGRATION_DB_NAME= 
    MIGRATION_DB_USER= 
    MIGRATION_DB_PASS=
    ```
   
   **N.B. :  In public facing servers DO NOT divulge how your server authenticates..**

6. Start the server `npm start`

   *default PORT = 8000*