const API_URL = "https://pokeapi.co/api/v2/pokemon";
const POKEMON_LIMIT = 20;

let offset = 0;
let pokemonData = [];
let pokemonDetailsData = [];
let pokemonCache = {};
let isLoading = false;

const pokemonList = document.querySelector(".pokemon-list");
const loadMoreButton = document.querySelector('[data-id="load-more-button"]');
const dialog = document.querySelector('[data-id="dialog"]');
const pokemonCards = document.querySelector(".pokemon-list");
const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector('[data-id="search-input"]');
const notFound = document.querySelector('[data-id="not-found"]');
const loading = document.querySelector('[data-id="loading"]');

async function init() {
    await loadPokemon();
}

async function loadPokemon() {
    if (isLoading) return;
    isLoading = true;
    loading.hidden = false;
    loadMoreButton.disabled = true;

    const response = await fetch(
        `${API_URL}?limit=${POKEMON_LIMIT}&offset=${offset}`
    );

    const data = await response.json();

    pokemonData = [...pokemonData, ...data.results];
    await renderPokemon(data.results);
    offset += POKEMON_LIMIT;
    loading.hidden = true;
    isLoading = false;
    loadMoreButton.disabled = false;
}
async function renderPokemon(pokemonArray) {
    const pokemonDetails = await getPokemonDetails(pokemonArray);
    pokemonDetailsData = [...pokemonDetailsData, ...pokemonDetails];
    pokemonList.innerHTML += pokemonDetails
        .map(createPokemonCard)
        .join("");
}
async function getPokemonDetails(pokemonArray) {
    return Promise.all(
        pokemonArray.map(async (pokemon) => {
            if (pokemonCache[pokemon.name]) {
                return pokemonCache[pokemon.name];
            }

            const response = await fetch(pokemon.url);
            const data = await response.json();
            pokemonCache[pokemon.name] = data;
            return data;

        })
    );
}

async function searchPokemon() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm.length === 0) {
        pokemonList.innerHTML = pokemonDetailsData
            .map(createPokemonCard)
            .join("");
    }

    if (searchTerm.length < 3) return;
    const pokemon = pokemonDetailsData.filter((pokemon) =>
        pokemon.name.includes(searchTerm)
    );

    pokemonList.innerHTML = pokemon.map(createPokemonCard).join("");
    notFound.hidden = pokemon.length !== 0;
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchPokemon();
});

function createPokemonCard(pokemon) {
    const types = pokemon.types
        .map((type) => type.type.name)
        .join(" / ");
    return `
        <li>
           <button class="pokemon-card type-${pokemon.types[0].type.name}" data-id="card" data-pokemon-id="${pokemon.id}" type="button">
                <img
                    data-id="card-image"
                    src="${pokemon.sprites.front_default}"
                    alt="${pokemon.name}"
                >
                <span class="pokemon-name">${pokemon.name}</span>
                <span class="pokemon-type">${types}</span>
            </button>
        </li>
    `;
}

loadMoreButton.addEventListener("click", loadPokemon);

function openPokemonDialog(pokemon) {
    const dialogName = document.querySelector(".dialog-name");
    const dialogImage = document.querySelector('[data-id="dialog-image"]');
    const hp = document.querySelector(".stat-hp");
    const attack = document.querySelector(".stat-attack");
    const defense = document.querySelector(".stat-defense");

    dialogName.textContent = pokemon.name;
    dialogImage.src = pokemon.sprites.front_default;
    dialogImage.alt = pokemon.name;
    dialogImage.dataset.pokemonId = pokemon.id;

    hp.textContent = pokemon.stats[0].base_stat;
    attack.textContent = pokemon.stats[1].base_stat;
    defense.textContent = pokemon.stats[2].base_stat;

    dialog.showModal();
}

pokemonCards.addEventListener("click", (event) => {
    const card = event.target.closest('[data-id="card"]');

    if (!card) return;
    const pokemonId = Number(card.dataset.pokemonId);
    const pokemon = pokemonDetailsData.find(
        (pokemon) => pokemon.id === pokemonId
    );
    openPokemonDialog(pokemon);
});

function showNextPokemon() {
    const currentId = Number(
        document.querySelector('[data-id="dialog-image"]').dataset.pokemonId
    );

    const nextPokemon = pokemonDetailsData.find(
        (pokemon) => pokemon.id === currentId + 1
    );

    if (nextPokemon) {
        openPokemonDialog(nextPokemon);
    }
}

function showPreviousPokemon() {
    const currentId = Number(
        document.querySelector('[data-id="dialog-image"]').dataset.pokemonId
    );

    const previousPokemon = pokemonDetailsData.find(
        (pokemon) => pokemon.id === currentId - 1
    );

    if (previousPokemon) {
        openPokemonDialog(previousPokemon);
    }
}

document.querySelector('[data-id="next-button"]')
    .addEventListener("click", showNextPokemon);

document.querySelector('[data-id="prev-button"]')
    .addEventListener("click", showPreviousPokemon);


document.querySelector('[data-id="close-dialog-button"]')
    .addEventListener("click", () => {
        dialog.close();
    });

dialog.addEventListener("click", (event) => {
if (event.target === dialog) {
    dialog.close();
}
});






init();