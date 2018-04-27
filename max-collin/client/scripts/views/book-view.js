'use strict';
var app = app || {};

(function(module) {
  $('.icon-menu').on('click', function(event) {
    $('.nav-menu').slideToggle(350);
  });

  function resetView() {
    $('.container').hide();
    $('.nav-menu').slideUp(350);
  }

  const bookView = {};

  bookView.initIndexPage = function(ctx, next) {
    resetView();
    $('.book-view').show();
    $('#book-list').empty();
    module.Book.all.forEach(book => $('#book-list').append(book.toHtml()));
    next();
  };

  bookView.initDetailPage = function(ctx, next) {
    resetView();
    $('.detail-view').show();
    $('.book-detail').empty();
    let template = Handlebars.compile($('#book-detail-template').text());
    $('.book-detail').append(template(ctx.book));

    $('#update-btn').on('click', function() {
      page(`/books/${$(this).data('id')}/update`);
    });

    $('#delete-btn').on('click', function() {
      module.Book.destroy($(this).data('id'));
    });
    next();
  };

  bookView.initCreateFormPage = function() {
    resetView();
    $('.create-view').show();
    $('#create-form').on('submit', function(event) {
      event.preventDefault();

      let book = {
        title: event.target.title.value,
        author: event.target.author.value,
        isbn: event.target.isbn.value,
        image_url: event.target.image_url.value,
        description: event.target.description.value,
      };

      module.Book.create(book);
    });
  };

  bookView.initUpdateFormPage = function(ctx) {
    resetView();
    $('.update-view').show();
    $('#update-form input[name="title"]').val(ctx.book.title);
    $('#update-form input[name="author"]').val(ctx.book.author);
    $('#update-form input[name="isbn"]').val(ctx.book.isbn);
    $('#update-form input[name="image_url"]').val(ctx.book.image_url);
    $('#update-form textarea[name="description"]').val(ctx.book.description);

    $('#update-form').on('submit', function(event) {
      event.preventDefault();

      let book = {
        book_id: ctx.book.book_id,
        title: event.target.title.value,
        author: event.target.author.value,
        isbn: event.target.isbn.value,
        image_url: event.target.image_url.value,
        description: event.target.description.value,
      };

      module.Book.update(book, book.book_id);
    });
  };

  // COMMENT: What is the purpose of this method?
  // this method previews the form page in our SPA by hiding other page relient elements and showing the ones corresponding to the form page
  bookView.initSearchFormPage = function() {
    resetView();
    $('.search-view').show();
    $('#search-form').on('submit', function(event) {
      // COMMENT: What default behavior is being prevented here?
      // On default any submit button will refresh the page. Clearing any inputs by the user
      event.preventDefault();

      // COMMENT: What is the event.target, below? What will happen if the user does not provide the information needed for the title, author, or isbn properties?
      // The targets are the input boxes inside the form element; If the user does not fill in the input box, instead of returning undefined, it returns an empty string.
      let book = {
        title: event.target.title.value || '',
        author: event.target.author.value || '',
        isbn: event.target.isbn.value || '',
      };

      module.Book.find(book, bookView.initSearchResultsPage);

      // COMMENT: Why are these values set to an empty string?
      // If the user were to search for books, then went back to the SearchFormPage, those values would stay there because of the preventDefault. This clears them AFTER the submission.
      event.target.title.value = '';
      event.target.author.value = '';
      event.target.isbn.value = '';
    });
  };

  // COMMENT: What is the purpose of this method?
  // this method previews the searchresultspage by invoking the resetView fn (which probably hides the page relient elements on the page)
  bookView.initSearchResultsPage = function() {
    resetView();
    $('.search-results').show();
    $('#search-list').empty();

    // COMMENT: Explain how the .forEach() method is being used below.
    // for every element (book) in the Book's (Book.all) array, it appends the books to the #search-list.
    module.Book.all.forEach(book => $('#search-list').append(book.toHtml()));
    $('.detail-button a').text('Add to list').attr('href', '/');
    $('.detail-button').on('click', function(e) {
      // COMMENT: Explain the following line of code.
      // the .parent() is a selector, it is grabbing the 3rd parent of the "cloned" template .book-list-template and invokes the find one selector on it (this).
      module.Book.findOne($(this).parent().parent().parent().data('bookid'));
    });
  };

  module.bookView = bookView;
})(app);

