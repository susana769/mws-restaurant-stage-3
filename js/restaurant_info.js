﻿let restaurant;var map;/** * Initialize Google map, called from HTML. */window.initMap = () => {  fetchRestaurantFromURL((error, restaurant) => {    if (error) { // Got an error!      console.error(error);    } else {      self.map = new google.maps.Map(document.getElementById('map'), {        zoom: 16,        center: restaurant.latlng,        scrollwheel: false      });      fillBreadcrumb();      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);    }  });}/** * Get current restaurant from page URL. */fetchRestaurantFromURL = (callback) => {  if (self.restaurant) { // restaurant already fetched!    callback(null, self.restaurant)    return;  }  const id = getParameterByName('id');  if (!id) { // no id found in URL    error = 'No restaurant id in URL'    callback(error, null);  } else {    DBHelper.fetchRestaurantById(id, (error, restaurant) => {      self.restaurant = restaurant;      if (!restaurant) {        console.error(error);        return;      }      fillRestaurantHTML();      callback(null, restaurant)    });    DBHelper.addReviewsFromAPI(id).then(function(reviews){      fillReviewsHTML(reviews);    })  }}/** * Create restaurant HTML and add it to the webpage */fillRestaurantHTML = (restaurant = self.restaurant) => {  const name = document.getElementById('restaurant-name');  name.innerHTML = restaurant.name;  /*Create the title hidden for the map*/  document.getElementById('mapTitle').innerHTML='Map with location of ' + restaurant.name;    const address = document.getElementById('restaurant-address');  address.setAttribute("tabindex", 0);  address.innerHTML = restaurant.address;  const image = document.getElementById('restaurant-img');    const imgSrc = DBHelper.imageUrlForRestaurant(restaurant);    image.setAttribute("alt", restaurant.textAlt);  image.className = 'restaurant-img'  image.src = imgSrc + ".jpg";    const cuisine = document.getElementById('restaurant-cuisine');  cuisine.setAttribute("tabindex", 0);  cuisine.innerHTML = restaurant.cuisine_type;  // fill operating hours  if (restaurant.operating_hours) {    fillRestaurantHoursHTML();  }  // fill reviews  fillReviewsHTML();}/** * Create restaurant operating hours HTML table and add it to the webpage. */fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {  const hours = document.getElementById('restaurant-hours');  for (let key in operatingHours) {    const row = document.createElement('tr');    const day = document.createElement('td');    day.setAttribute("class", "restaurantHoursDay");    day.setAttribute("tabindex", 0);    day.innerHTML = key;    row.appendChild(day);    const time = document.createElement('td');    time.innerHTML = operatingHours[key];    time.setAttribute("tabindex", 0);    row.appendChild(time);    hours.appendChild(row);  }}/** * Create all reviews HTML and add them to the webpage. */fillReviewsHTML = (reviews = self.restaurant.reviews) => {  const container = document.getElementById('reviews-container');  const title = document.createElement('h3');  title.setAttribute("tabindex", 0);  title.innerHTML = 'Reviews';  container.appendChild(title);  if (!reviews) {    const noReviews = document.createElement('p');    noReviews.innerHTML = 'No reviews yet!';    container.appendChild(noReviews);    return;  }  const ul = document.getElementById('reviews-list');  reviews.forEach(review => {    ul.appendChild(createReviewHTML(review));  });  container.appendChild(ul);}/** * Create review HTML and add it to the webpage. */createReviewHTML = (review) => {  const li = document.createElement('li');  const div = document.createElement('div');  div.setAttribute("class", "reviewTitle");  const name = document.createElement('h4');  name.setAttribute("class", "reviewName");  name.setAttribute("tabindex", 0);  name.innerHTML = review.name;   div.appendChild(name);  const date = document.createElement('p');  date.setAttribute("class", "reviewDate");  date.innerHTML = review.date;  date.setAttribute("tabindex", 0);  div.appendChild(date);  li.appendChild(div);  const rating = document.createElement('p');  rating.setAttribute("class", "reviewRating");  rating.innerHTML = `Rating: ${review.rating}`;  rating.setAttribute("tabindex", 0);  li.appendChild(rating);  const comments = document.createElement('p');  comments.setAttribute("class", "reviewComments");  comments.innerHTML = review.comments;  li.appendChild(comments);  return li;}/** * Add restaurant name to the breadcrumb navigation menu */fillBreadcrumb = (restaurant=self.restaurant) => {  const breadcrumb = document.getElementById('breadcrumb');  const li = document.createElement('li');  const a = document.createElement('a');  a.innerHTML = restaurant.name;  a.setAttribute('aria-current', 'page');  li.appendChild(a);  breadcrumb.appendChild(li);}/** * Get a parameter by name from page URL. */getParameterByName = (name, url) => {  if (!url)    url = window.location.href;  name = name.replace(/[\[\]]/g, '\\$&');  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),    results = regex.exec(url);  if (!results)    return null;  if (!results[2])    return '';  return decodeURIComponent(results[2].replace(/\+/g, ' '));}postReview = (restaurant = self.restaurant) => {  const restaurantId = restaurant.id;  const username = document.getElementById("username").value;  const rating = document.getElementById("rating").value;  const comment = document.getElementById("comment").value;  let date = new Date();  console.log(date);  let reviewForPost = {    restaurant_id: restaurantId,    name: username,    rating: rating,    comments: comment,  }  fetch(`http://localhost:1337/reviews/`, {    method: 'POST',    body: JSON.stringify(reviewForPost),    headers: {      'content-type': 'application/json'    }  })  .then(res => res.json())  .then(review => {    console.log(review);    const ul = document.getElementById('reviews-list');    ul.appendChild(createReviewHTML(review));  })  .catch(error => {    console.log(error);  });}/**  * Add new review */formatDate = (ts) => {    let date = new Date(ts);    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();}let form = document.querySelector('#new-review-form');form.addEventListener('submit', e => {  e.preventDefault();    let rating = form.querySelector('#review-rating');  let review = {      "restaurant_id": parseInt(getParameterByName('id')),      "name": form.querySelector('#review-name').value,      "rating": rating.options[rating.selectedIndex].value,      "comments": form.querySelector('#review-comment').value  };  DBHelper.submitReview(review, (error) => {      if (error) {          console.log('Error: '+ error);      }  }).then((data) => {      const ul = document.getElementById('reviews-list');    review.createdAt = new Date();    review.updatedAt = new Date();    ul.appendChild(createReviewHTML(review));    form.reset();  }).catch(error => {      console.log(error);  });});