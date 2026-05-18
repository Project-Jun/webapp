let selectedTag = "전체";

function renderFoods() {

  const keyword =
    document.getElementById("search-input")
      .value
      .trim();

  const category =
    document.getElementById("category-select")
      .value;

  const filteredFoods = foodDB.filter(food => {

    // 검색어
    const matchKeyword =
      food.name.includes(keyword);

    // 카테고리
    const matchCategory =
      category === "전체" ||
      food.category === category;

    // 태그
    const matchTag =
      selectedTag === "전체" ||
      food.tags.includes(selectedTag);

    return (
      matchKeyword &&
      matchCategory &&
      matchTag
    );
  });

  displayFoods(filteredFoods);
}

function displayFoods(foodArray) {

  const foodList =
    document.getElementById("food-list");

  foodList.innerHTML = "";

  foodArray.forEach(food => {

    foodList.innerHTML += `
      <div class="food-card">

        <img src="${food.image}">

        <h3>${food.name}</h3>

        <p>${food.category}</p>

      </div>
    `;
  });
}