const inputTask = document.querySelector("#fname");
const form = document.querySelector("#form");
const containerCheckLists = document.querySelector("#containerCheckLists");
const todotab = document.querySelector("#todoTab");
const buttonActivateTab = document.querySelector("#tab-button");
const buttonActivateTabIcon = document.querySelector("#tab-button i");
const buttonHome = document.querySelector("#home-button");
const guidePopup = document.querySelector("#guidePopup");

// import anime from "node_module/animejs/lib/anime.es.js";

class checkList {
  constructor(taskName, coords) {
    this.id = Date.now();
    this.taskName = taskName;
    this.type = "general";
    this.checked = false;
    this.coords = coords;
  }
}

class App {
  #homeData = {};
  #map;
  #mapEvent;
  #tasksList = [];

  constructor() {
    this._getLocation();

    this._getLocationGeocoder();

    form.addEventListener("submit", this._newTask.bind(this));

    containerCheckLists.addEventListener(
      "click",
      this.functionCheckUncheck.bind(this)
    );

    buttonActivateTab.addEventListener("click", this._openCloseTab.bind(this));

    buttonHome.addEventListener("click", () =>
      this._moveToMarker(this.#homeData)
    );

    containerCheckLists.addEventListener("click", this._removeTask.bind(this));

    setTimeout(this._guidePopupOff, 4000);
  }

  _guidePopupOff() {
    guidePopup.classList.add("guideOff");
    setTimeout(() => (guidePopup.style.display = "none"), 1000);
  }

  _openTab() {
    todotab.classList.add("tab-active");
    this._changeTabButtonIcon();
  }

  _openCloseTab() {
    todotab.classList.toggle("tab-active");
    this._changeTabButtonIcon();
  }

  _changeTabButtonIcon() {
    todotab.className.includes("tab-active")
      ? (buttonActivateTabIcon.className = "bi bi-x")
      : (buttonActivateTabIcon.className = "bi bi-check");
  }

  _getLocationGeocoder() {
    const request = new XMLHttpRequest();

    request.open(
      "GET",
      "https://api.mapbox.com/geocoding/v5/mapbox.places/houston.json?access_token=pk.eyJ1IjoianVzdGluOWVsaWFzMTgiLCJhIjoiY2tzNDYzZ3EzMThzYjJ1cW1pbmN1a2hmZiJ9.uunTYdjXWS_ZNOjshzd4FQ"
    );
    request.send();

    request.addEventListener("load", function () {
      const objectCoords = JSON.parse(this.responseText);
      console.log(objectCoords.features[0].center);
    });
  }

  _getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        //use browser API to get location
        this._renderMap.bind(this), //call renderMap function with position object as atribute
        function () {
          alert("Not possible to get your coordinates");
        }
      );
    }
  }

  _renderMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude]; //getting latitude and longitude

    this.#homeData.coords = coords;

    this.#map = L.map("map").setView(coords, 15); //creating map and setting its view

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    const homeMarker = L.marker(coords)
      .addTo(this.#map)
      .bindPopup("You are here!")
      .openPopup();

    this.#homeData.marker = homeMarker;

    // L.control({ position: "topright" }).addTo(this.#map);

    this.#map.zoomControl.setPosition("bottomright");

    this.#map.on("click", this._newClickCoords.bind(this));
  }

  _newClickCoords(infoClick) {
    const { lat, lng } = infoClick.latlng;

    this._openTab();

    this.#mapEvent = [lat, lng];

    inputTask.focus();
  }

  //_newTask function activates with 'submit' eventlistener added in App constructor
  _newTask(e) {
    e.preventDefault(); //prevents page reset

    const taskName = inputTask.value;

    const task = new checkList(taskName, this.#mapEvent);

    //adding marker to object as atribute
    task.marker = this._newMarker(task);

    //adding task object to task list array
    this.#tasksList.push(task);

    //new marker to map
    task.marker.addTo(this.#map).openPopup();

    //new item to checklist
    this._newItemCheckList(task);

    //clears submit value
    this._clearSubmit();

    //set local storage
    // this._setLocalStorage();

    // this._getLocalStorage();
  }

  _removeTask(e) {
    if (e.target.className.includes("checkClose")) {
      const taskId = e.target.closest(".divCheck").querySelector("input").id;
      const taskObject = this.#tasksList.find((obj) => "" + obj.id === taskId);

      if (
        confirm(
          `Are you sure you want to delete the task "${taskObject.taskName}" ?`
        )
      ) {
        //remove marker
        taskObject.marker.remove();

        //remove element
        e.target.closest(".divCheck").remove();

        //remove from array
        this.#tasksList.splice(this.#tasksList.indexOf(taskObject), 1);
      }
    }
  }

  _newMarker(task) {
    return L.marker(task.coords).bindPopup(`${task.taskName}`);

    // L.marker(this.#mapEvent)
    // .addTo(this.#map)
    // .bindPopup(`${task.taskName}`)
    // .openPopup();
  }

  _newItemCheckList(task) {
    const html = `
          <div class="divCheck">
            <input
              type="checkbox"
              class="form-check-input inputCheck"
              id="${task.id}"
              name="${task.taskName}"
              value="${task.taskName}"
            />  
            <label for="${task.id}" class="form-check-label">
            ${task.taskName}</label
            >
            <i class="bi bi-x-circle checkClose"></i>
          </div>
            `;

    containerCheckLists.insertAdjacentHTML("beforeend", html);
  }

  _clearSubmit() {
    inputTask.value = "";
    inputTask.blur();
  }

  functionCheckUncheck(e) {
    //element clicked
    const targetEl = e.target;

    const taskObject = this.#tasksList.find(
      (item) =>
        "" + item.id === targetEl.closest(".divCheck").querySelector("input").id
    );

    console.log(taskObject);

    if (targetEl.className.includes("inputCheck")) {
      //finding object with task

      if (targetEl.checked !== undefined) taskObject.checked = targetEl.checked;

      !taskObject.checked
        ? taskObject.marker.setOpacity(1)
        : taskObject.marker.setOpacity(0.5);
    }

    if (targetEl.className.includes("divCheck")) {
      this._moveToMarker(taskObject);
    }
  }

  _moveToMarker(taskObject) {
    this.#map.setView(taskObject.coords);
    setTimeout(() => taskObject.marker.openPopup(), 500);
  }

  // _setLocalStorage() {
  //   let taskList = [...this.#tasksList];
  //   // console.log(taskList);
  //   taskList = taskList.map((task) => (task.marker = ""));
  //   console.log(this.#tasksList);
  //   // localStorage.setItem("taskList", JSON.stringify(taskList));
  // }

  // _getLocalStorage() {
  //   JSON.parse(localStorage.getItem("taskList")).forEach((taskObj) =>
  //     console.log(taskObj)
  //   );
  // }
}

const app = new App();
