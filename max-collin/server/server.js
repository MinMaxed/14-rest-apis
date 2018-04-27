'use strict';

// Application dependencies
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');
const bodyparser = require('body-parser');

// Application Setup
const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;
const TOKEN = process.env.TOKEN;

// COMMENT: Explain the following line of code. What is the API_KEY? Where did it come from? In this instance, the API_KEY is grabbing our environmental variable called GOOGLE_API_KEY which we set manually on heroku, or wherever we will deploy this code.

const GOOGLE_API_KEY = 'AIzaSyB2pfxQ_jwu-9ZENSxDNPK09WN_oWgQLJE';
const API_KEY = process.env.GOOGLE_API_KEY;


// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// Application Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.get('/api/v1/admin', (req, res) => res.send(TOKEN === parseInt(req.query.token)));

app.get('/api/v1/books/find', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';

  // COMMENT: Explain the following four lines of code. How is the query built out? What information will be used to create the query? The query is being built based on the requested information from the API, only accepting completed targets.
  let query = '';
  if (req.query.title) query += `+intitle:${req.query.title}`;
  if (req.query.author) query += `+inauthor:${req.query.author}`;
  if (req.query.isbn) query += `+isbn:${req.query.isbn}`;

  // COMMENT: What is superagent? How is it being used here? What other libraries are available that could be used for the same purpose?
  //Superagent is a proxy handler that prevents keys from being leaked to a 3rd party. It is attatching the superAgent to the .get request that contains sensative information / our API_KEY Oauth have similar uses.
  superagent.get(url)
    .query({ 'q': query })
    .query({ 'key': API_KEY })
    .then(response => response.body.items.map((book, idx) => {

      // COMMENT: The line below is an example of destructuring. Explain destructuring in your own words. It's allowing you to connect multiple variables as values to an object referenced as the volumeInfo property.
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;

      // COMMENT: What is the purpose of the following placeholder image? A placeholder if the book doesnt have a cover somehow.
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';

      // COMMENT: Explain how ternary operators are being used below. If the object's property doesn't have the value, it sets a placeholder or alternative value to use.
      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
        book_id: industryIdentifiers ? `${industryIdentifiers[0].identifier}` : '',
      };
    }))
    .then(arr => res.send(arr))
    .catch(console.error);
});

// COMMENT: How does this route differ from the route above? What does ':isbn' refer to in the code below? This route is finding a specific book via the isbn, which is a key that's given to books when they are published.
app.get('/api/v1/books/find/:isbn', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';
  superagent.get(url)
    .query({ 'q': `+isbn:${req.params.isbn}` })
    .query({ 'key': API_KEY })
    .then(response => response.body.items.map((book, idx) => {
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';

      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
      };
    }))
    .then(book => res.send(book[0]))
    .catch(console.error);
});

app.get('/api/v1/books', (req, res) => {
  client.query(`SELECT book_id, title, author, image_url, isbn FROM books;`)
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.get('/api/v1/books/:id', (req, res) => {
  client.query(`SELECT * FROM books WHERE book_id=${req.params.id}`)
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.post('/api/v1/books', (req, res) => {
  let { title, author, isbn, image_url, description } = req.body;
  client.query(`
    INSERT INTO books(title, author, isbn, image_url, description) VALUES($1, $2, $3, $4, $5)`,
  [title, author, isbn, image_url, description]
  )
    .then(results => res.sendStatus(201))
    .catch(console.error);
});

app.put('/api/v1/books/:id', (req, res) => {
  let { title, author, isbn, image_url, description } = req.body;
  client.query(`
    UPDATE books
    SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5
    WHERE book_id=$6`,
  [title, author, isbn, image_url, description, req.params.id]
  )
    .then(() => res.sendStatus(204))
    .catch(console.error);
});

app.delete('/api/v1/books/:id', (req, res) => {
  client.query('DELETE FROM books WHERE book_id=$1', [req.params.id])
    .then(() => res.sendStatus(204))
    .catch(console.error);
});

app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
