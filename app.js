const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMovieDBObjectToResponseObject = (movieObject) => {
  return {
    movieId: movieObject.movie_id,
    directorId: movieObject.director_id,
    movieName: movieObject.movie_name,
    leadActor: movieObject.lead_actor,
  };
};

const convertDirectorDBObjectToResponseObject = (directorObject) => {
  return {
    directorId: directorObject.director_id,
    directorName: directorObject.director_name,
  };
};

//API 1: Returns a list of all movie names in the movie table
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
       select movie_name from movie;
    `;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) =>
      convertMovieDBObjectToResponseObject(eachMovie)
    )
  );
});

//API 2: Creates a new movie in the movie table. `movie_id` is auto-incremented
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
       insert into movie(director_id,movie_name,lead_actor)
       values(${directorId}, '${movieName}', '${leadActor}');
  `;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//API 3: Returns a movie based on the movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
         select * from movie where movie_id=${movieId};
    `;
  const movie = await db.get(getMovieQuery);
  response.send(convertMovieDBObjectToResponseObject(movie));
});

//API 4: Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMoviesQuery = `
   update movie set
        director_id=${directorId},
        movie_name='${movieName}',
        lead_actor='${leadActor}'
        where movie_id=${movieId}
        ;
  `;
  await db.run(updateMoviesQuery);
  response.send("Movie Details Updated");
});

//API 5: Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
          delete from movie where movie_id=${movieId}; 
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API 6: Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
        select * from director;
    `;
  const directorArray = await db.all(getDirectorsQuery);
  response.send(
    directorArray.map((eachDirector) =>
      convertDirectorDBObjectToResponseObject(eachDirector)
    )
  );
});

//API 7: Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieNamesQuery = `
       select movie_name from movie where director_id=${directorId};
    `;
  const movieNamesArray = await db.all(getMovieNamesQuery);
  response.send(
    movieNamesArray.map((eachMovieName) =>
      convertMovieDBObjectToResponseObject(eachMovieName)
    )
  );
});

module.exports = app;
