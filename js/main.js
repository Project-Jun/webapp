// js/main.js

function recommendMenu() {

  if(foodDB.length === 0) return;

  const randomIndex =
    Math.floor(Math.random() * foodDB.length);

  const selectedFood =
    foodDB[randomIndex];

  document.getElementById("today-menu").innerText =
    selectedFood.name;
}

function goWorldcup() {
  location.href = "worldcup.html";
}

function goFridge() {
  location.href = "recipe.html";
}

// 첫 실행
recommendMenu();