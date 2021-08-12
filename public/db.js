// Different browsers can have different names for the indexedDB object, so we standardize that here
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;

// open or create database
const request = indexedDB.open("budgetTracker_DB", 1);

// object store
request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("transaction", { autoIncrement: true });
};


request.onsuccess = ({ target }) => {
  db = target.result;
  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

//error handler.
request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

// This will get called when it's time to save data to the indexedDb
function saveRecord(record) {
  const transaction = db.transaction(["transaction"], "readwrite");
  const store = transaction.objectStore("transaction");
  store.add(record);
}

// Runs when we detect that the internet connection is working again. 
function checkDatabase() {
  const transaction = db.transaction(["transaction"], "readwrite");
  const store = transaction.objectStore("transaction");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {        
        return response.json();
      })
      .then(() => {
        // delete records if successful
        const transaction = db.transaction(["transaction"], "readwrite");
        const store = transaction.objectStore("transaction");
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);