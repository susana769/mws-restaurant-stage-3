/**
 * Common database helper functions.
 */
class DBHelper {
    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http:\//localhost:${port}/restaurants`;
    }

    static openDatabase() {
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }

        return idb.open('restaurantDb', 1, function(upgradeDb){
            let store = upgradeDb.createObjectStore('restaurantDb', {
                keyPath: 'id'
            });
            store.createIndex('by-id', 'id');
            upgradeDb.createObjectStore('reviewsDb', {keyPath: 'id'});
            upgradeDb.createObjectStore('reviewsDbOffLine', {keyPath: 'updatedAt'});
        });
    }

    static writeReviewsData(){
        return openDatabase()
            .then(function (dbObject) {
                const transaction = dbObject.transaction('reviewsDb' , 'readwrite');
                transaction.objectStore('reviewsDb');
                return transaction.complete;
            });
    }

    static writeReviewsDataOffline(data){
        alert ("You're Offline! Your review will be sent as soon as you have an internet connection");
        return DBHelper.openDatabase()
            .then(function (db) {
                var transaction = db.transaction('reviewsDbOffLine' , 'readwrite');
                var store = transaction.objectStore('reviewsDbOffLine');
                store.put(data);



                let interval = setInterval(() => 
                {                    
                  if (navigator.onLine) 
                  {
                      clearInterval(interval);
                      showMessage("Attempting to add review");
                      DBHelper.postOflineReview(parseInt(restId), reviews).then(review => 
                      {
                          document.getElementById('reviews-list').appendChild(createReviewHTML(review));
                          showMessage("Review now added");
                      });
                  }
                } , 5000);
            });


    }

    static saveReviewToDatabase(reviews) {
        return DBHelper.openDatabase().then(function(db){
            if(!db) return;

            var transaction = db.transaction('reviewsDb', 'readwrite');
            var store = transaction.objectStore('reviewsDb');
            reviews.forEach(function(review){
                store.put(review);
            });
            return transaction.complete;
        });
    }

    static addReviewsFromAPI(id) {
        return fetch(`http:\//localhost:1337/reviews/?restaurant_id=${id}`)
            .then(function(response){
                return response.json();
            }).then(reviews => {
                DBHelper.saveReviewToDatabase(reviews);
                return reviews;
            });
    }

    static saveRestaurantToDatabase(data){
        return DBHelper.openDatabase().then(function(db){
            if(!db) return;

            let transaction = db.transaction('restaurantDb', 'readwrite');
            let store = transaction.objectStore('restaurantDb');
            data.forEach(function(restaurant){
                store.put(restaurant);
            });
            return transaction.complete;
        });
    }

    static submitReview(data, callback) {
      if (!navigator.onLine){
        console.log("esta offline");

      /*   DBHelper.postReview(parseInt(restId), name, rating, reviewBody, reviews).then(review =>
        {
            document.getElementById('reviewModal').style.display = "none";
            document.getElementById('reviews-list').appendChild(createReviewHTML(review, review.updatedAt));
            showMessage("Review added");
        });
      }*/

      return fetch('http://localhost:1337/reviews', {
          body: JSON.stringify(data),
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          method: 'POST',
      })
          .then(response => {
              response.json()
                  .then(data => { DBHelper.writeReviewsData();
                      return data;
                  });
              callback(null)
          })
          .catch(() => {
              data['updatedAt'] = new Date().getTime();
              data['createdAt'] = new Date().getTime();
              DBHelper.writeReviewsDataOffline(data);
          });
    }

     static postOflineReview(restId, reviews)
    {
        return new Promise((resolve,reject) => 
        {
            if(!dbPromise)
            {
                dbPromise = DBHelper.openDB();
            }
            dbPromise.then(function(db)
            {
                if(!db) return;
                var tx = db.transaction('reviewsDbOffLine');
                var store = tx.objectStore('reviewsDbOffLine');
                return store.get(restId);
            }).then(function(review)
            {
            DBHelper.postReview(review.restaurant_id , review.name , review.rating , review.comments , reviews).then(data => 
            {
                dbPromise.then(function(db)
                {
                    var tx = db.transaction('reviewsDbOffLine',  'readwrite');
                    var store = tx.objectStore('reviewsDbOffLine');
                    store.delete(restId);
                    return tx.complete;
                });
                resolve(data);
            });
            });
        });
    }

    static addRestaurantsFromAPI(){
        return fetch(DBHelper.DATABASE_URL)
            .then(function(response){
                return response.json();
            }).then(restaurants => {
                DBHelper.saveRestaurantToDatabase(restaurants);
                return restaurants;
            });
    }

    static getCachedRestaurants() {
        return DBHelper.openDatabase().then(function(db){
            if(!db) return;

            const store = db.transaction('restaurantDb').objectStore('restaurantDb');
            return store.getAll();
        });
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        return DBHelper.getCachedRestaurants().then(restaurants => {
            if(restaurants.length) {
                return Promise.resolve(restaurants);
            } else {
                return DBHelper.addRestaurantsFromAPI();
            }
        })
            .then(restaurants=> {
                callback(null, restaurants);
            })
            .catch(error => {
                callback(error, null);
            })
    }

    /* Fetch a restaurant by id */
    static fetchRestaurantById(id, callback) {
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) {
                    callback(null, restaurant);
                } else {
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /* Fetch restaurants by a cuisine and one neighborhood */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine !== 'all') {
                    results = results.filter(r => r.cuisine_type === cuisine);
                }
                if (neighborhood !== 'all') {
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /* Fetch all neighborhoods */
    static fetchNeighborhoods(callback) {
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /* Fetch all cuisines */
    static fetchCuisines(callback) {
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
                callback(null, uniqueCuisines);
            }
        });
    }

    /* Restaurant id URL */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /* Restaurant image URL */
    static imageUrlForRestaurant(restaurant) {
        return (`/images_src/${restaurant.photograph}`);
    }

    /* Map marker for a restaurant */
    static mapMarkerForRestaurant(restaurant, map) {
        return new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP}
        );
    }
}