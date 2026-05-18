// js/recipe.js

let searchMode = "menu";

let selectedTags = [];

// 검색 실행
function renderFoods() {

  const keyword =
    document.getElementById("search-input")
      .value
      .trim()
      .toLowerCase();

  const filteredFoods =
    foodDB.filter(food => {

      // 메뉴 검색
      let matchSearch = true;

      if (keyword !== "") {

        // 메뉴명 검색 모드
        if (searchMode === "menu") {

          matchSearch =
            food.name
              .toLowerCase()
              .includes(keyword);

        }

        // 재료 검색 모드
        else {

          const inputIngredients =
            keyword
              .split(",")
              .map(item => item.trim());

          const ingredients =
            food.ingredients || [];

          matchSearch =

            inputIngredients.some(inputIngredient =>

              ingredients.some(ingredient =>

                ingredient.name
                  .toLowerCase()
                  .includes(inputIngredient)
              )
            );
        }
      }

      // 태그 필터
      const tags =
        food.tags || [];

      const matchTag =

        selectedTags.length === 0 ||

        selectedTags.every(tag =>

          tags.includes(tag)
        );

      return (
        matchSearch &&
        matchTag
      );
    });

  displayFoods(filteredFoods);
}

// 카드 출력
function displayFoods(foodArray) {

  const foodList =
    document.getElementById("food-list");

  foodList.innerHTML = "";

  if (foodArray.length === 0) {

    foodList.innerHTML = `
      <p class="empty-text">
        검색 결과가 없습니다 😢
        최대한 빨리 다양한 레시피를 추가할 예정입니다!
      </p>
    `;

    return;
  }

  foodArray.forEach(food => {

    // 재료
    const ingredients =
      food.ingredients || [];

    const ingredientHTML =

      ingredients.length > 0

        ?

        ingredients.map(ingredient =>

          `
        <li>
          ${ingredient.name}
          (${ingredient.quantity})
        </li>
        `
        ).join("")

        :

        `<li>재료 정보 없음</li>`;

    // 레시피
    const recipes =
      food.recipe || [];

    const recipeHTML =

      recipes.length > 0

        ?

        recipes.map(step =>

          `
        <li>${step}</li>
        `
        ).join("")

        :

        `<li>레시피 정보 없음</li>`;

    foodList.innerHTML += `

      <div class="food-card">

        <img
          src="${food.image}"
          alt="${food.name}"
        >

        <div class="food-info">

          <h2>
            ${food.name}
          </h2>

          <p class="food-category">
            ${food.category || "카테고리 없음"}
          </p>

          <!-- 재료 -->
          <div class="ingredient-section">

            <h3>
              재료
            </h3>

            <ul>
              ${ingredientHTML}
            </ul>

          </div>

          <!-- 버튼 -->
          <button
            class="recipe-btn"
            onclick="toggleRecipe(${food.id})"
          >
            레시피 보기
          </button>

          <!-- 레시피 -->
          <div
            class="recipe-section"
            id="recipe-${food.id}"
          >

            <h3>
              레시피
            </h3>

            <ol>
              ${recipeHTML}
            </ol>

          </div>

        </div>

      </div>
    `;
  });
}

// 레시피 펼치기
function toggleRecipe(foodId) {

  const recipeSection =
    document.getElementById(`recipe-${foodId}`);

  if (recipeSection.style.display === "block") {

    recipeSection.style.display = "none";

  } else {

    recipeSection.style.display = "block";
  }
}

// 검색 버튼
document
  .getElementById("search-btn")
  .addEventListener("click", renderFoods);

// 엔터 검색
document
  .getElementById("search-input")
  .addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

      renderFoods();
    }
  });

// 실시간 검색
document
  .getElementById("search-input")
  .addEventListener("input", renderFoods);

// 검색 모드 변경
document
  .querySelectorAll(".mode-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      // active 제거
      document
        .querySelectorAll(".mode-btn")
        .forEach(btn =>
          btn.classList.remove("active")
        );

      // active 추가
      button.classList.add("active");

      // 검색 모드 변경
      searchMode =
        button.dataset.mode;

      // placeholder 변경
      const searchInput =
        document.getElementById("search-input");

      if (searchMode === "menu") {

        searchInput.placeholder =
          "메뉴명을 입력하세요 (예: 김치볶음밥)";

      } else {

        searchInput.placeholder =
          "재료를 입력하세요 (예: 계란, 밥)";
      }

      renderFoods();
    });
  });

// 태그 선택
document
  .querySelectorAll(".tag-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      const tag =
        button.dataset.tag;

      // 이미 선택된 경우 제거
      if (selectedTags.includes(tag)) {

        selectedTags =
          selectedTags.filter(t => t !== tag);

        button.classList.remove("selected");
      }

      // 선택 안된 경우 추가
      else {

        selectedTags.push(tag);

        button.classList.add("selected");
      }

      renderFoods();
    });
  });

// 첫 실행
renderFoods();