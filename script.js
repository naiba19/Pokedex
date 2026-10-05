const API_URL = "https://pokeapi.co/api/v2/pokemon";
const POKEMON_LIMIT = 30;

let offset = 0;
let pokemonData = [];
let pokemonDetailsData = [];
let isLoading = false;

const pokemonList = document.querySelector(".pokemon-list");
const loadMoreButton = document.querySelector('[data-id="load-more-button"]');
const dialog = document.querySelector('[data-id="dialog"]');
const pokemonCards = document.querySelector(".pokemon-list");

async function init() {
    await loadPokemon();
}

async function loadPokemon() {
    if (isLoading) return;
    isLoading = true;
    loadMoreButton.disabled = true;

    const response = await fetch(
        `${API_URL}?limit=${POKEMON_LIMIT}&offset=${offset}`
    );

    const data = await response.json();

    pokemonData = [...pokemonData, ...data.results];
    await renderPokemon(data.results);
    offset += POKEMON_LIMIT;
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
            const response = await fetch(pokemon.url);
            return response.json();
        })
    );
}

function createPokemonCard(pokemon) {
    const types = pokemon.types
        .map((type) => type.type.name)
        .join(" / ");
    return `
        <li>
            <button class="pokemon-card" data-id="card" data-pokemon-id="${pokemon.id}" type="button">
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

    dialogName.textContent = pokemon.name;
    dialogImage.src = pokemon.sprites.front_default;
    dialogImage.alt = pokemon.name;
    dialogImage.dataset.pokemonId = pokemon.id;

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
init();