# Bookmarks Server - Without Database

This is a locally based server used to C.R.U.D. URL bookmarks.

*Note: Data is not persistent as a database is not hooked up, yet.. with the exception of **hard-coded** store*

## Set up

Complete the following steps to locally configure the server:

1. Clone this repository to your local machine `git clone SERVER-URL bookmarks-server`
2. `cd` into the cloned repository
3. Install node dependencies `npm install`
4. Set up environmental in `.env` including `API_TOKEN` and `PORT`
   
   **N.B. :  In public facing servers DO NOT divulge how your server authenticates..**
5. Start the server `npm start`

   *default PORT = 8000*